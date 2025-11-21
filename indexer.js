require("dotenv").config();
require("./connection");
const Web3 = require("web3");
const CurrentBlock = require("./model/CurrentBlock.js");
const user = require("./model/User.js");
const DepositHistory = require('./model/Deposithistory.js');



const { contractAddress, contractAddressABI, contractToken, contractTokenABI } = require("./config");
const distributeReferralIncome = require("./helper.js");
const User = require("./model/User.js");
const Spiner = require("./model/Spiner.js");
const withdrawReward = require("./model/withdrawReward.js");

const rpc = "https://bsc-rpc.publicnode.com";

// const rpc = process.env.RPC_URL;

const startNow = () => {

    const web3 = new Web3(rpc);
    const ico_contract = new web3.eth.Contract(contractAddressABI, contractAddress);
    return Promise.resolve({ web3, ico_contract });
};


const getPastEventsWithRetry = async (
    contract,
    options,
    retries = 3,
    delay = 1000
) => {
    try {
        return await contract.getPastEvents("allEvents", options);
    } catch (error) {
        console.error("Error fetching events:", error);
        if (retries > 0) {
            console.log(`Retrying in ${delay} milliseconds...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            return getPastEventsWithRetry(contract, options, retries - 1, delay * 2);
        } else {
            throw new Error("Exceeded maximum number of retries");
        }
    }
};

const getWeb3Data = async (cbl) => {
    try {
        const instance = await startNow();
        const currentBlockfromWeb3 = await instance.web3.eth.getBlockNumber();

        // Get current block from DB
        const currentBlockDoc = await CurrentBlock.findOne({}, { blockNumber: 1, _id: 0 });
        let currentBlockInDB = currentBlockDoc?.blockNumber || (currentBlockfromWeb3 - 100);

        console.log("➡️ currentBlockInDB:", currentBlockInDB);
        console.log("➡️ currentBlockfromWeb3:", currentBlockfromWeb3, cbl);

        // Fetch in chunks to avoid "exceed max block range" error
        const CHUNK_SIZE = 1000;

        while (currentBlockInDB < currentBlockfromWeb3) {
            const toBlock = Math.min(currentBlockInDB + CHUNK_SIZE, currentBlockfromWeb3);
            console.log(`🧩 Fetching events from ${currentBlockInDB} to ${toBlock}`);

            try {
                const events = await instance.ico_contract.getPastEvents("allEvents", {
                    fromBlock: currentBlockInDB,
                    toBlock,
                });

                console.log(events.length, "events Length")

                if (events.length > 0) {
                    for (const item of events) {
                        console.log("📦 Event found:", item.event, "Block:", item.blockNumber);

                        if (item.event === "Registration") {
                            console.log("Event Received :::::", item?.events)
                            const exists = await user.findOne({ user_id: item.returnValues.tuser_id });
                            if (exists) {

                                await user.updateOne(
                                    { _id: exists._id }, // condition (find by user address)
                                    {
                                        $set: {
                                            user_address: item.returnValues.user,
                                            referral_address: item.returnValues.referrer
                                        },
                                    },
                                    { upsert: true } // create a new document if not found
                                );
                                console.log("✅ Registration saved:", item.transactionHash);
                            }
                        }

                        if (item.event === "Deposit") {
                            console.log(item.event, item, "deposit")
                            const dexist = await DepositHistory.findOne({ transactionHash: item.transactionHash });
                            console.log("Deposit history check:", dexist);

                            if (!dexist) {
                                const exists = await user.findOne({ user_address: item.returnValues.user });
                                if (exists) {


                                    const deposit = await DepositHistory.create({
                                        user: item.returnValues.user, // reference to User
                                        tuserId: item.returnValues.tuser_id,
                                        depositAmt: item.returnValues.depositAmt,
                                        transactionHash: item.transactionHash,
                                        date: new Date() // ya blockchain se date le sakte ho agar available hai
                                    });
                                    if (deposit) {
                                        await User.updateOne(
                                            { _id: exists._id },
                                            {
                                                $inc: {
                                                    deposit_balance: item.returnValues.depositAmt,
                                                    avaibleSpin: 4,
                                                    entry: 1,

                                                },

                                            },
                                            { upsert: true }
                                        )
                                        await Spiner.updateOne(
                                            {}, {
                                            $inc: {
                                                entry: 1
                                            }
                                        }
                                        )
                                        await distributeReferralIncome.distributeLevelIncome(item.returnValues.user, ((Number(item.returnValues.depositAmt) / 1e18) - 4));
                                    }
                                }
                                //await deposit.save();

                                console.log("✅ Deposit saved:", item.transactionHash);
                            }
                        }
                    if (item.event === "Withdrawal") {
    const key = `${item.transactionHash}${item.returnValues.time}${item.blockNumber}`;
    const transactionHash = item.transactionHash;
    const exists = await withdraw.findOne({ transactionHash });

    if (!exists) {
        const amount = Number(item.returnValues.amount) / 1e18;

        // ADD 10% BONUS
        const finalAmount = amount + (amount * 0.10); // amount * 1.10

        await withdrawReward
            .create({
                key,
                id: item.returnValues.id,
                amount: finalAmount, // store final amount with 10%
                userAddress: item.returnValues.userAddress,
                nonce: item.returnValues.nonce,
                transactionHash: item.transactionHash,
                blockNumber: item.blockNumber,
                time: item.returnValues.time || item.returnValues.timestamp,
            })
            .then(async () => {
                console.log("Withdraw inserted");

                await User.findOneAndUpdate(
                    { user_address: item.returnValues.userAddress },
                    {
                        $inc: {
                            earning_balance: -finalAmount, // subtract 10% extra
                            total_claim: finalAmount,       // add 10% extra
                        },
                    },
                    { new: true }
                );
            })
            .catch((err) => console.error("Withdraw insert error:", err));
    } else {
        console.log("Duplicate WithdrawFund event ignored");
    }
}


                    }
                } else {
                    console.log("ℹ️ No events found in this range.");
                }

                // Update block progress after each chunk
                await CurrentBlock.updateOne({}, { $set: { blockNumber: toBlock } });
                console.log(`🟢 Block updated to ${toBlock}`);

                // Move to next chunk
                currentBlockInDB = toBlock;
            } catch (err) {
                console.error("❌ Error fetching events:", err.message);
                console.log("⏳ Retrying after 5 seconds...");
                await new Promise((r) => setTimeout(r, 5000));
            }
        }

        console.log("🎉 Sync complete!");
    } catch (error) {
        console.error("💥 getWeb3Data error:", error.message);
    }
};

module.exports = { getWeb3Data };
