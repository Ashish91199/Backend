const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    sponsorId: {
        type: String,
        required: true,
    },
    user: {
        type: Object,
        required: true
    }
});

module.exports = mongoose.model("Login", UserSchema);

