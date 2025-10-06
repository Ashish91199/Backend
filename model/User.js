const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    user_id: { type: String, required: true, unique: true },  // e.g., MEJ7634347
    username: { type: String, required: true },
    user_address: { type: String, required: false },
    referrer_id: { type: String, default: null },
    referral_address: { type: String, required: false },
    telegram_id: { type: String, required: true, unique: true },
    direct_income: { type: Number, default: 0 },
    deposit_balance: { type: Number, default: 0 },
    earning_balance: { type: Number, default: 0 },
    remaining_balance: { type: Number, default: 0 },
    total_claim: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
