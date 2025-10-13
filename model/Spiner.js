const mongoose = require("mongoose");

const SpinerSchema = new mongoose.Schema(
    {
        spincount: {
            type: Number,
            required: true,
        },
        entry: {
            type: Number,
            required: true,
        },
    },
    { timestamps: true } // adds createdAt and updatedAt automatically
);

module.exports = mongoose.model("spiner", SpinerSchema);
