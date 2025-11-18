const Rank = require("./model/Rank");

const User = require("./model/User");
const DepositHistory = require("./model/Deposithistory");
const levelIncome = require("./model/levelIncome");


const { contractAddressABI, contractAddress } = require("./config");
const withdrawReward = require("./model/withdrawReward");
const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.RPC_URL));

const ContractAddress = new web3.eth.Contract(contractAddressABI, contractAddress);

const distributeLevelIncome = async (userAddress, amount) => {
    try {
        const directRequired = [0, 3, 5, 8, 10];
        const levelPercentage = [5, 2, 1, 1, 1];
        const spinRequired = [1, 1, 1, 1, 1]
        console.log("in distributer level income", userAddress, amount)

        const uplines = await User.aggregate([
            { $match: { user_address: userAddress } },
            {
                $graphLookup: {
                    from: "users",
                    startWith: "$referral_address",
                    connectFromField: "referral_address",
                    connectToField: "user_address",
                    as: "uplines",
                    maxDepth: 4,
                    depthField: "level",
                },
            },
            { $unwind: "$uplines" },
            { $match: { "uplines.level": { $gte: 0, $lte: 4 } } },
            { $sort: { "uplines.level": 1 } },
            {
                $project: {
                    _id: 0,
                    user_address: "$uplines.user_address",
                    level: { $add: ["$uplines.level", 1] }
                },
            },
        ]);

        for (const upline of uplines) {
            const level = upline.level;
            const requiredDirects = directRequired[level - 1];
            const percent = levelPercentage[level - 1];

            const uplineUser = await User.findOne({ user_address: upline.user_address });
            if (!uplineUser) continue;

            const totalDirects = await User.countDocuments({ referral_address: upline.user_address });

            if (totalDirects >= requiredDirects && uplineUser.avaibleSpin >= 1) {
                const earned = (amount * percent) / 100;

                await User.updateOne(
                    { user_address: upline.user_address },
                    {
                        $inc: {
                            level_income: earned,
                            earning_balance: earned,
                        }
                    }
                );

                // ✅ Save Level Income History
                await levelIncome.create({
                    from_user: userAddress,
                    to_user: upline.user_address,
                    level: level,
                    percentage: percent,
                    amount: earned
                });

                console.log(`Level ${level} | ${upline.user_address} earned ${earned}`);
            }
        }

    } catch (error) {
        console.log("Error in distribute:", error);
    }
};

const checkUserRank = async (user_id) => {
    try {
        const user = await User.findOne({ user_id });
        if (!user) return console.log("❌ User not found");

        const directs = await User.find({ referrer_id: user_id });
        console.log(directs.length, user_id, "direct")
        let newRank = user.rank || 0;

        // 🥇 Rank 1: If any one direct has 5 directs
        let hasQualifiedLeg = false;
        for (const d of directs) {
            const subDirects = await User.countDocuments({ referrer_id: d.user_id });
            if (subDirects >= 5) {
                hasQualifiedLeg = true;
                break; // one leg is enough
            }
        }
        if (hasQualifiedLeg) newRank = Math.max(newRank, 1);

        // 🥈 Rank 2: Has 3 Rank1 in different legs
        if (newRank >= 1) {
            const rank1Count = directs.filter((d) => d.rank >= 1).length;
            if (rank1Count >= 3) newRank = Math.max(newRank, 2);
        }

        // 🥉 Rank 3: Has 4 Rank2 in different legs
        if (newRank >= 2) {
            const teamData = await User.aggregate([
                { $match: { user_id } },
                {
                    $graphLookup: {
                        from: "users",
                        startWith: "$user_id",
                        connectFromField: "user_id",
                        connectToField: "referrer_id",
                        as: "team",
                    },
                },
            ]);
            const team = teamData[0]?.team || [];

            let rank2Legs = 0;
            for (const direct of directs) {
                const hasRank2 = team.some(
                    (member) => member.referrer_id === direct.user_id && member.rank >= 2
                );
                if (hasRank2) rank2Legs++;
            }
            if (rank2Legs >= 4) newRank = Math.max(newRank, 3);
        }

        // 🏅 Rank 4: Has 5 Rank3 in different legs
        if (newRank >= 3) {
            const teamData = await User.aggregate([
                { $match: { user_id } },
                {
                    $graphLookup: {
                        from: "users",
                        startWith: "$user_id",
                        connectFromField: "user_id",
                        connectToField: "referrer_id",
                        as: "team",
                    },
                },
            ]);
            const team = teamData[0]?.team || [];

            let rank3Legs = 0;
            for (const direct of directs) {
                const hasRank3 = team.some(
                    (member) => member.referrer_id === direct.user_id && member.rank >= 3
                );
                if (hasRank3) rank3Legs++;
            }
            if (rank3Legs >= 5) newRank = Math.max(newRank, 4);
        }

        // 🏆 Rank 5: Has 5 Rank4 in different legs
        if (newRank >= 4) {
            const teamData = await User.aggregate([
                { $match: { user_id } },
                {
                    $graphLookup: {
                        from: "users",
                        startWith: "$user_id",
                        connectFromField: "user_id",
                        connectToField: "referrer_id",
                        as: "team",
                    },
                },
            ]);
            const team = teamData[0]?.team || [];

            let rank4Legs = 0;
            for (const direct of directs) {
                const hasRank4 = team.some(
                    (member) => member.referrer_id === direct.user_id && member.rank >= 4
                );
                if (hasRank4) rank4Legs++;
            }
            if (rank4Legs >= 5) newRank = Math.max(newRank, 5);
        }

        // ✅ Update user rank only if increased
        if (newRank > user.rank) {
            await User.updateOne({ user_id }, { $set: { rank: newRank } });
            console.log(`✅ Rank updated → Rank ${newRank} for user ${user_id}`);
        } else if (newRank === user.rank) {
            console.log(`ℹ️ No rank change (Rank ${user.rank}) for user ${user_id}`);
        } else {
            console.log(`⚠️ Rank decrease ignored (User ${user_id})`);
        }

    } catch (error) {
        console.error("❌ Error checking rank:", error);
    }
};

const cronRankCheck = async () => {
    try {
        console.log("🚀 Starting rank check cron job...");
        const allUsers = await User.find({}, { user_id: 1, rank: 1 });

        for (const user of allUsers) {
            await checkUserRank(user.user_id);
        }

        console.log("✅ Rank check completed successfully!");
    } catch (error) {
        console.error("❌ Error in cronRankCheck:", error);
    }
};


const distrbuteRank = async () => {
    try {
        const now = new Date();

        // get yesterday’s start & end
        const start = new Date(now);
        start.setDate(now.getDate() - 1);
        start.setHours(0, 0, 0, 0);

        const end = new Date(now);
        end.setDate(now.getDate() - 1);
        end.setHours(23, 59, 59, 999);

        console.log(`⏰ Fetching deposits from ${start} to ${end}`);

        const deposits = await DepositHistory.find({
            createdAt: { $gte: start, $lte: end },
        });

        const depositCount = deposits.length;

        if (depositCount === 0) {
            console.log("No deposits found for yesterday.");
            return;
        }

        // 💰 total pool based on deposit count
        const totalPool = depositCount * 4; // 4 per deposit
        console.log(`💰 Total pool based on ${depositCount} deposits: ${totalPool}`);

        // 🏦 Bonus pool by rank
        const bonusPool = {
            1: totalPool * 0.4,
            2: totalPool * 0.25,
            3: totalPool * 0.15,
            4: totalPool * 0.1,
            5: totalPool * 0.1,
        };

        console.log("🏦 Bonus Pool:", bonusPool);

        // 🎖 Get users by rank
        const ranks = await User.aggregate([
            { $match: { rank: { $gte: 1 } } },
            { $group: { _id: "$rank", users: { $push: "$user_id" }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
        ]);

        for (const r of ranks) {
            const rankNum = r._id;
            const users = r.users;
            const count = r.count;

            const pool = bonusPool[rankNum] || 0;
            if (pool <= 0 || count === 0) continue;

            const perUserBonus = pool / count;

            console.log(
                `🎖 Rank ${rankNum} → ${count} users, each gets ${perUserBonus.toFixed(2)}`
            );

            for (const userId of users) {
                // update user
                await User.updateOne(
                    { user_id: userId },
                    {
                        $inc: {
                            rankIncome: perUserBonus,
                            earning_balance: perUserBonus,
                        },
                    }
                );

                // add to history
                await Rank.create({
                    user_id: userId,
                    rank: rankNum,
                    receivedAmount: perUserBonus,
                    totalPoolAmount: pool,
                    totalDepositAmount: totalPool
                });
            }
        }

        console.log("✅ Rank income distribution completed!");
    } catch (error) {
        console.error("❌ Error in distrbuteRank:", error);
    }
};


async function processWithdrawal(userAddress, hash, amount) {


    try {
        const lastWithdrawFund = await withdrawReward.findOne({ userAddress: userAddress }).sort({ _id: -1 });

        let prevNonce = 0;
        if (!lastWithdrawFund) {
            prevNonce = -1;
        } else {
            prevNonce = lastWithdrawFund.nonce;
        }

        const currNonce = await ContractAddress.methods.nonce(userAddress).call();
        console.log(currNonce, "currNonce:::,", prevNonce, "currNonce:::111,", Number(currNonce))
        if (prevNonce + 1 !== Number(currNonce)) {
            throw new Error("Invalid withdrawal request!");
        }
        const vrsSign = await giveVrsForWithdraw(
            userAddress,
            hash,
            Number(currNonce),
            web3.utils.toWei(amount.toString(), "ether")
        );

        return vrsSign;
    } catch (error) {
        console.error("Error in processWithdrawal:", error);
        throw error;
    }
}

function giveVrsForWithdraw(user, hash, nonce, amount) {
    return new Promise(async (resolve, reject) => {
        try {
            const data = {
                user,
                amount,
            };

            const account = web3.eth.accounts.privateKeyToAccount(process.env.Operator_Wallet);

            web3.eth.accounts.wallet.add(account);
            web3.eth.defaultAccount = account.address;

            const signature = await web3.eth.sign(hash, account.address);

            const vrsValue = parseSignature(signature)
            data["signature"] = vrsValue;
            resolve({ ...data, amount });

            //   console.log(data, "data::::")
        } catch (error) {
            console.error("Error in signing the message:", error);
            reject(error);
        }
    });
}

function parseSignature(signature) {

    const sigParams = signature.substr(2);
    const v = "0x" + sigParams.substr(64 * 2, 2);
    const r = "0x" + sigParams.substr(0, 64);
    const s = "0x" + sigParams.substr(64, 64);

    return { v, r, s };
}

module.exports = { distributeLevelIncome, checkUserRank, cronRankCheck, distrbuteRank, processWithdrawal };
