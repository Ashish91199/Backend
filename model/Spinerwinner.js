const mongoose = require("mongoose");

const SpinnerWinnerSchema = new mongoose.Schema(
    {
        tuserId: { type: String, required: true }, // Who spun the wheel
        prize: { type: String, required: true },
    },
    { timestamps: true } // Adds createdAt and updatedAt fields automatically
);

module.exports = mongoose.model("SpinnerWinner", SpinnerWinnerSchema);
