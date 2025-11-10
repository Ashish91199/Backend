const mongoose = require("mongoose");

const withdrawFundSchema = new mongoose.Schema({

    amount: { type: String, required: true },
    key: { type: String, required: true },
    userAddress: { type: String, required: true },

    nonce: { type: Number, required: true },

    transactionHash: { type: String, unique: true, required: true }
},
    { timestamps: true, collection: "withdraw" }
);

module.exports = mongoose.model("withdrawReward", withdrawFundSchema);