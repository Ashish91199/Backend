const mongoose = require("mongoose");

const incomeSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ["referral", "level", "rank", "spin"],
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        default: 0,
    },
    fromUser: {
        type: String,
        default: null, // optional, e.g., who generated this income
    },
    level: {
        type: Number,
        default: null, // only used for multi-level income
    },
    rank: {
        type: Number,
        default: null, // only used for rank bonus
    },
    entryId: {
        type: String,
        default: null, // optional, link to spin/deposit that generated income
    },
    transactionHash: { type: String, default: null, },
    date: {
        type: Date,
        default: () => Math.floor(Date.now()),
    },
});

module.exports = mongoose.model("Income", incomeSchema);
