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

router.post("/Users", async (req, res) => {
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
        if (newUser) {
            const findReffer = await User.findOne({ referrer_id: referrer_id })
            if (findReffer) {
                await User.updateOne(
                    { _id: findReffer._id },
                    {
                        $inc: {
                            direct_income: 5

                        }
                    }
                )
            }
        }
        res.status(201).json({ status: "User created successfully!", data: newUser });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: "Server error", error: err.message });
    }
});
router.get("/Users", async (req, res) => {
    try {
        const users = await User.find(); // Mongoose uses find()
        res.status(200).json({ status: "Success", data: users });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: "Server error", error: err.message });
    }
});

// Get user by ID
router.get("/Users/:id", async (req, res) => {
    try {
        const { id } = req.params;

        // Step 1: Find main user
        const user = await User.findOne({ user_id: id });
        if (!user) {
            return res.status(404).json({ status: "User not found!" });
        }

        // Step 2: Find all users referred by this user
        const referrals = await User.find({ referrer_id: user.user_id })
            .select("user_id username telegram_id createdAt");

        // Step 3: Combine both
        const result = {

            referrals: referrals
        };

        res.status(200).json({ status: "Success", data: referrals });
    } catch (err) {
        console.error("Error fetching user and referrals:", err);
        res.status(500).json({ status: "Server error", error: err.message });
    }
});


module.exports = router;
