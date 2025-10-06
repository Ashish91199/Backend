const mongoose = require("mongoose");
const { Schema } = mongoose;

const configSchema = new Schema({
  lastSyncBlock: { type: Number, required: true },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const config = mongoose.model("config", configSchema);

module.exports = config;
