const { default: axios } = require("axios");
const express = require("express");
const Product = require("../model/Product");
const Login = require("../model/Login");
const User = require("../model/User")

const router = express.Router();
require("dotenv").config();
const env = process.env;

router.post("/telegram", async (req, res) => {
    const { message } = req.body;

    try {
        await axios.post(`https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/sendMessage`, {
            chat_id: env.CHAT_ID,
            text: message,
        });
        res.status(200).json({ status: "Message sent!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: "Error sending message" });
    }
});

router.post("/user", async (req, res) => {
    const { name, email, number } = req.body;

    if (!name || !email || !number) {
        return res.status(400).json({ status: "All fields are required!" });
    }

    try {
        const user = await User.create({ name, email, number });
        res.status(201).json({ status: "User created successfully!", user });
    } catch (err) {
        console.error(err);
        // Duplicate email or number handle
        if (err.code === 11000) {
            return res.status(409).json({ status: "Email or number already exists!" });
        }
        res.status(500).json({ status: "Server error", error: err.message });
    }
});

router.get("/users", async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json({ status: "success", users });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: "error", message: err.message });
    }
});
router.post("/Product", async (req, res) => {
    const { name, productName, price, width } = req.body;

    // Required fields check
    if (!name || !productName || !price || !width) {
        return res.status(400).json({ status: "All fields are required!" });
    }

    try {
        const Pro = await Product.create({ name, productName, price, width });
        res.status(201).json({ status: "Product created successfully!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: "Server error", error: err.message });
    }
});
router.post("/Login", async (req, res) => {
    const { sponsorId, user } = req.body;

    if (!sponsorId || !user) {
        return res.status(400).json({ status: "Sponsor ID and Name are required!" });
    }

    try {
        const newUser = await Login.create({ sponsorId, user });
        res.status(201).json({ status: "User created successfully!", data: newUser });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: "Server error", error: err.message });
    }
});


router.get("/Products", async (req, res) => {
    try {
        const Products = await Product.find();
        res.status(200).json({ status: "success", Products });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: "error", message: err.message });
    }
});

router.post("/user", async (req, res) => {
    const { user_id, username, user_address, referrer_id, referral_address, telegram_id } = req.body;

    if (!user_id || !username || !user_address || !referral_address) {
        return res.status(400).json({ status: "Required fields missing!" });
    }

    try {
        const newUser = await User.create({
            user_id,
            username,
            user_address,
            referrer_id: referrer_id || null,
            referral_address,
            telegram_id: telegram_id || null
        });

        res.status(201).json({ status: "User created successfully!", data: newUser });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: "Server error", error: err.message });
    }
});

module.exports = router;
