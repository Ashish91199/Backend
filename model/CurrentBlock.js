const mongoose = require("mongoose");
const currentBlockSchema = new mongoose.Schema({
    blockNumber: {
        type: String,


    },
}, { timestamps: true }); // createdAt & updatedAt automatically

const CurrentBlock = mongoose.model("CurrentBlock", currentBlockSchema);

module.exports = CurrentBlock;