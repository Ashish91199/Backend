const mongoose = require("mongoose");

const depositHistorySchema = new mongoose.Schema(
    {
        user: {
            type: String, // If referencing User model: mongoose.Schema.Types.ObjectId, ref: "User"
            required: true,
        },
        tuserId: {
            type: String,
            required: true,
        },
        depositAmt: {
            type: Number,
            required: true,
        },
        transactionHash: {
            type: String,
            required: true,
            unique: true,
        },
        calstatus: {
            type: Number,
            enum: [0, 1], // 0 = pending, 1 = calculated
            default: 0,
        },
        date: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true } // adds createdAt and updatedAt automatically
);

module.exports = mongoose.model("DepositHistory", depositHistorySchema);
