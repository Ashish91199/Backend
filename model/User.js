const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const User = require("./models/User"); // your User model path

const app = express();
app.use(express.json());

// ✅ Telegram Bot Token
const BOT_TOKEN = "8356563754:AAGQqAdlklr4YQUFOlV-gu_5tHSpMMzxCcM";
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// ✅ /start webhook (Telegram will call this)
app.post("/start", async (req, res) => {
    try {
        const message = req.body.message;
        if (!message || !message.from) {
            return res.status(400).json({ status: "Invalid Telegram data" });
        }

        const telegramUser = message.from;
        const user_id = telegramUser.id.toString();
        const username = telegramUser.username || "Unknown";
        const referral_address = `ref_${user_id}`;
        const user_address = `addr_${user_id}`;

        // ✅ Check if user exists
        let user = await User.findOne({ user_id });
        if (!user) {
            user = new User({
                user_id,
                username,
                user_address,
                referral_address,
                telegram_id: user_id,
            });
            await user.save();
        }

        // ✅ Send welcome message to Telegram
        await axios.post(`${TELEGRAM_API}/sendMessage`, {
            chat_id: telegramUser.id,
            text: `👋 Hello ${username}! You are registered successfully.`,
        });

        res.json({ status: "User registered successfully", user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: "Server error", error: err.message });
    }
});

// ✅ Start server
mongoose.connect("mongodb://127.0.0.1:27017/telegramdb")
    .then(() => {
        app.listen(5000, () => console.log("✅ Server running on port 5000"));
    })
    .catch(err => console.error("MongoDB connection error:", err));
