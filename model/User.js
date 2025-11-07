const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    user_id: { type: String, unique: true },  // e.g., MEJ7634347
    username: { type: String, required: true },
    user_address: { type: String, required: false, unique: true },
    referrer_id: { type: String, default: null },
    referral_address: { type: String, required: false },
    telegram_id: { type: String, required: true, unique: true },
    direct_income: { type: Number, default: 0 },
    level_income: { type: Number, default: 0 },
    deposit_balance: { type: Number, default: 0 },
    earning_balance: { type: Number, default: 0 },
    remaining_balance: { type: Number, default: 0 },
    total_claim: { type: Number, default: 0 },
    avaibleSpin: {
        type: Number,
        default: 0,
        min: 0
    },
    completeSpin: {
        type: Number,
        default: 0,
        min: 0
    },
    spinearnBalance: {
        type: Number,
        default: 0,
        min: 0
    },
    reamingBalance: {
        type: Number,
        default: 0,

    },
    entry: {
        type: Number,
        default: 0,

    },
    rank: {
        type: Number,
        default: 0
    },
    rankIncome: {
        type: Number,
        default: 0
    },

}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
