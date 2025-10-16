const mongoose = require("mongoose");
const User = require("./model/User");
const IncomeModel = require("./model/IncomeModel");
const DepositHistory = require("./model/Deposithistory");
const levelIncome = require("./model/levelIncome");



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

module.exports = { distributeLevelIncome };
