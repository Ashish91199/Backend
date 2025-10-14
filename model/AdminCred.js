const mongoose = require("mongoose");

const AdminCred = new mongoose.Schema(
  {
    email: { type: String, required: true, default: "mejora@admin.com" },
    password: { type: String, required: true, default: "mejora@123" },
  },
  { timestamps: true, collection: "AdminCred" }
);

AdminCred.index({ email: 1, password: 1 }, { unique: true });

module.exports = mongoose.model("AdminCred", AdminCred);
