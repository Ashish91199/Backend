const mongoose = require("mongoose");

const LevelIncomeSchema = new mongoose.Schema({
    from_user: { type: String, required: true },     // The spender/user who generated income
    to_user: { type: String, required: true },       // The upline who received income
    level: { type: Number, required: true },         // Level number (1 to 5)
    percentage: { type: Number, required: true },    // % earned
    amount: { type: Number, required: true },        // Calculated amount
}, { timestamps: true, collection: "levelIncome" });

module.exports = mongoose.model("LevelIncomeHistory", LevelIncomeSchema);
