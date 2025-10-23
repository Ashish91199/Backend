const Rank = require("./model/Rank");

const mongoose = require("mongoose");
const User = require("./model/User");
const IncomeModel = require("./model/IncomeModel");
const DepositHistory = require("./model/Deposithistory");
const levelIncome = require("./model/levelIncome");
const Deposithistory = require("./model/Deposithistory");



// const distributeReferralIncome = async (userId, amt = 5) => {

//     const session = await mongoose.startSession();
//     session.startTransaction();

//     try {
//         const user = await User.findOne({ user_id: userId }).session(session);
//         if (!user || !user.referrer_id) {
//             await session.abortTransaction();
//             session.endSession();
//             return false;
//         }

//         const userBalance = user.deposit_balance || 0;
//         if (userBalance < amt) {
//             console.log(`❌ User ${userId} does not have enough balance`);
//             await session.abortTransaction();
//             session.endSession();
//             return false;
//         }


//         // Add referral income to referrer
//         const referrer = await User.findOneAndUpdate(
//             { user_id: user.referrer_id },
//             { $inc: { direct_income: amt } },
//             { new: true, session }
//         );
//         await IncomeModel.create({
//             userId: user.referrer_id,
//             fromUser: user.user_id,
//             type: "referral",
//             amount: amt

//         })
//         if (!referrer) {
//             console.log(`❌ Referrer not found for user ${userId}`);
//             await session.abortTransaction();
//             session.endSession();
//             return false;
//         }

//         await session.commitTransaction();
//         session.endSession();

//         console.log(
//             `✅ $${amt} referral income distributed from ${userId} to ${user.referrer_id}`,
//             referrer
//         );
//         return true;
//     } catch (error) {
//         await session.abortTransaction();
//         session.endSession();
//         console.error("Error in distributeReferralIncome:", error);
//         return false;
//     }
// };


// async function directLevelIncome() {
//     try {
//         const allrec = await DepositHistory.find({ calstatus: 0 }, { tuserId: 1, transactionHash: 1 }).limit(200).lean().exec();
//         console.log("allrec: ", allrec);

//         if (allrec.length > 0) {
//             const directLevelIn = [];

//             for (const rec of allrec) {
//                 try {
//                     console.log("rv ::", rec.tuserId);
//                     const oku = await User.findOne({ user_id: rec.tuserId, referrer_id: { $ne: 0 } }, { user_id: 1, telegram_id: 1, referrer_id: 1, referral_address: 1 }).lean().exec();
//                     console.log("Referal :: ", oku);
//                     if (oku) {
//                         //console.log("oku ", oku);
//                         let currentReferrerId = oku.referrer_id;

//                         let i = 1; let direct_income = 5; let dirstatus = 0;
//                         console.log("currentReferrerId :: ", currentReferrerId);
//                         while (currentReferrerId) {
//                             try {
//                                 const record = await User.findOne({ user_id: currentReferrerId, deposit_balance: { $gt: 0 } }, { user_id: 1, referrer_id: 1, referrer: 1, deposit_balance: 1 }).lean().exec();

//                                 // console.log(record, "record")
//                                 // console.log("record.deposit_balance :: ", record.user_id);
//                                 if (!record) {
//                                     await DepositHistory.updateOne({ _id: rec._id }, { $set: { calstatus: 1 } });
//                                     break;
//                                 }

//                                 console.log(record, "record")
//                                 console.log("record.deposit_balance :: ", record.user_id);
//                                 //console.log("record ", record);
//                                 let iselig = 0; let income = 0;
//                                 let directStakeCount = getDirectReferral(record.user_id);
//                                 //const directStakeCount = record.directStakeCount ? record.directStakeCount : 0;
//                                 const stkeamt = record.deposit_balance ? record.deposit_balance : 0;
//                                 if (i == 1 && directStakeCount >= 1 && stkeamt >= 50) {
//                                     iselig = 1;
//                                 } else if (i == 2 && directStakeCount >= 3 && stkeamt >= 50) {
//                                     iselig = 1;
//                                 } else if (i == 3 && directStakeCount >= 5 && stkeamt >= 50) {
//                                     iselig = 1;
//                                 } else if (i == 4 && directStakeCount >= 8 && stkeamt >= 50) {
//                                     iselig = 1;
//                                 } else if (i == 5 && directStakeCount >= 10 && stkeamt >= 50) {
//                                     iselig = 1;
//                                 }
//                                 if (i == 1) { income = 2.5; }
//                                 else if (i == 2) { income = 1; }
//                                 else if (i == 3) { income = 0.5; }
//                                 else if (i == 4) { income = 0.5; }
//                                 else if (i == 5) { income = 0.5; }

//                                 //console.log("iselig ", iselig);
//                                 if (i == 1 && stkeamt >= 50) {
//                                     await IncomeModel.create({
//                                         userId: currentReferrerId,
//                                         type: 'referral',
//                                         amount: direct_income,
//                                         fromUser: rec.user_id,
//                                         level: 0,
//                                         rank: 0,
//                                         txHash: rec.transactionHash,
//                                         entryId: rec._id
//                                     });

//                                     directLevelIn.push({
//                                         insertOne: {
//                                             document: {
//                                                 userId: currentReferrerId,
//                                                 type: 'referral',
//                                                 amount: direct_income,
//                                                 fromUser: rec.tuserId,
//                                                 level: 0,
//                                                 rank: 0,
//                                                 txHash: rec.transactionHash,
//                                                 entryId: rec._id
//                                             },
//                                         },
//                                     });

//                                     await User.updateOne(
//                                         { user_id: currentReferrerId },
//                                         {
//                                             $inc: {
//                                                 earning_balance: direct_income,
//                                                 remaining_balance: direct_income,
//                                                 direct_income: direct_income,
//                                             },
//                                         });

//                                     console.log(`✅ Referral income added for user ${currentReferrerId}`);
//                                 }

//                                 if (iselig === 1) {
//                                     const incomeData = {
//                                         level: i,
//                                         type: "level",
//                                         amount: income,
//                                         fromUser: rec.tuserId,
//                                         rank: 0,
//                                         entryId: v._id,
//                                         txHash: rec.transactionHash
//                                     };

//                                     // if (record.return >= nowinc) {
//                                     await User.updateOne(
//                                         { user_id: currentReferrerId },
//                                         {
//                                             $inc: {
//                                                 earning_balance: incomeData.amount,
//                                                 remaining_balance: incomeData.amount,
//                                                 level_income: incomeData.amount,
//                                             },
//                                         }
//                                     );


//                                     directLevelIn.push({
//                                         insertOne: {
//                                             document: {
//                                                 userId: currentReferrerId,
//                                                 type: incomeData.type,
//                                                 amount: incomeData.amount,
//                                                 fromUser: rec.tuserId,
//                                                 level: i,
//                                                 rank: 0,
//                                                 txHash: rec.transactionHash,
//                                                 entryId: v._id
//                                             },
//                                         },
//                                     });
//                                 }
//                                 await DepositHistory.updateOne({ _id: rec._id }, { $set: { calstatus: 1 } });
//                                 i++;
//                                 if (i === 5) break; 3
//                                 currentReferrerId = record.referrerId;
//                             } catch (innerError) {
//                                 console.error(`Error processing level income for referrerId ${currentReferrerId}: `, innerError);
//                             }
//                         }
//                     }

//                 } catch (referrerError) {
//                     console.error(`Error processing daily ROI for user ${rec.user}: `, referrerError);
//                 }
//             }

//             if (directLevelIn.length > 0) {

//                 try {
//                     await IncomeModel.bulkWrite(directLevelIn);
//                     console.log("Submitting bulk operations for levelStake");

//                 } catch (bulkWriteError) {
//                     console.error("Error executing bulk write for levelStake: ", bulkWriteError);
//                 }
//             }
//         } else {
//             console.log("No Level Income to Send");
//         }
//     } catch (error) {
//         console.error("Error in levelOnRoi: ", error);
//     }
// }


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

const distributeBonusPool = async (amountPerEntry) => {
    try {
        console.log("Distributing Bonus Pool...");

        // Bonus distribution percentage for each rank
        const rankPercentages = { 1: 40, 2: 25, 3: 15, 4: 10, 5: 10 };



        // Step 1: Calculate total bonus pool
        const totalEntries = await Entry.countDocuments(); // suppose Entry is your spin entry model
        const totalBonusPool = totalEntries * amountPerEntry; // $4 per entry

        console.log(`Total Bonus Pool: ${totalBonusPool}`);

        // Step 2: Distribute rank-wise
        for (let rank = 1; rank <= 5; rank++) {
            const rankUsers = await User.find({ rank: rank });
            if (rankUsers.length === 0) continue;

            const rankSharePercent = rankPercentages[rank];
            const rankShare = (totalBonusPool * rankSharePercent) / 100;
            const eachUserShare = rankShare / rankUsers.length;

            console.log(
                `Rank ${rank}: ${rankUsers.length} users | Total ${rankShare.toFixed(
                    2
                )} | Each ${eachUserShare.toFixed(2)}`
            );

            for (const user of rankUsers) {
                await User.updateOne(
                    { user_address: user.user_address },
                    {
                        $inc: {
                            rank_income: eachUserShare,
                            earning_balance: eachUserShare,
                        },
                    }
                );

                // ✅ Save Rank Bonus History
                await RankIncome.create({
                    user_address: user.user_address,
                    rank: rank,
                    amount: eachUserShare,
                    total_pool: totalBonusPool,
                    pool_percent: rankSharePercent,
                });
            }
        }

        console.log("✅ Bonus Pool distributed successfully!");
    } catch (error) {
        console.log("❌ Error in distributeBonusPool:", error);
    }
};

async function getDirectReferral(userId) {
    try {
        const total = await User.countDocuments({
            referrer_id: userId,
            deposit_balance: { $gt: 0 } // ✅ only count users with balance > 0
        });
        return total;
    } catch (error) {
        console.error("❌ Error fetching total referrals:", error);
        return 0;
    }

}


const checkUserRank = async (user_id) => {
    try {
        const user = await User.findOne({ user_id });
        if (!user) return console.log("❌ User not found");

        const directs = await User.find({ referrer_id: user_id });
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


module.exports = { distributeLevelIncome, checkUserRank, cronRankCheck, distrbuteRank };
