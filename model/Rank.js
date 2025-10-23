// models/RankIncomeHistory.js
const mongoose = require('mongoose')

const rankIncomeHistorySchema = new mongoose.Schema({
    user_id: { type: String, required: true },           // who got reward
    rank: { type: Number, required: true },              // current rank of user
    receivedAmount: { type: Number, required: true },    // reward amount
    totalPoolAmount: { type: Number, required: true },
    totalDepositAmount: { type: Number, default: 0 },// total pool for that rank
    createdAt: { type: Date, default: Date.now },        // time of reward
}, { timestamps: true });

module.exports = mongoose.model("RankIncomeHistory", rankIncomeHistorySchema);
