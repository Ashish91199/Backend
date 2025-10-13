const mongoose = require("mongoose");

const SpinnerWinnerSchema = new mongoose.Schema({
    tuserId: { type: String, required: true },         // Who spun the wheel
    prize: { type: String, required: true },          // e.g. "5$", "20$"
});

module.exports = mongoose.model("SpinnerWinner", SpinnerWinnerSchema);
