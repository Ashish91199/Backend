const { default: axios } = require("axios");
const express = require("express");
const Product = require("../model/Product");
const Login = require("../model/Login");
const User = require("../model/User");
const CurrentBlock = require("../model/CurrentBlock");
const DepositHistory = require("../model/Deposithistory");
const Spiner = require("../model/Spiner");
const Spinerwinner = require("../model/Spinerwinner");


const router = express.Router();
require("dotenv").config();
const env = process.env;

router.post("/telegram", async (req, res) => {
    const { message } = req.body; 0

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

router.post("/setblock", async (req, res) => {
    const { blockNumber } = req.body; // ✅ use correct case

    try {
        if (!blockNumber) {
            return res.status(400).json({ status: "blockNumber is required" });
        }

        const set = await CurrentBlock.create({ blockNumber }); // ✅ matches schema
        res.status(201).json({ status: "Block saved successfully!", data: set });

    } catch (err) {
        console.error("Error saving block:", err);
        res.status(500).json({ status: "Error saving block", error: err.message });
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
    console.log({ user_id, username, user_address, referrer_id, referral_address, telegram_id })

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
router.get("/deposithistory", async (req, res) => {
    try {
        const deposits = await DepositHistory.find().sort({ createdAt: -1 }); // Optional: sort by latest first
        res.status(200).json({
            status: "success",
            count: deposits.length,
            data: deposits,
        });
    } catch (error) {
        console.error("Error fetching deposit history:", error);
        res.status(500).json({
            status: "error",
            message: "Server error while fetching deposit history",
            error: error.message,
        });
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
router.post("/profile", async (req, res) => {
    try {
        const { id } = req.body;

        if (!id) {
            return res.status(400).json({ success: false, message: "User ID is required" });
        }

        // Find user by MongoDB _id or custom user_id
        const user = await User.findOne({ telegram_id: id }); // or use {_id: id} if you mean MongoDB's id

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({
            success: true,
            message: "User profile fetched successfully",
            data: user
        });

    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
});


router.post("/spiner-run", async (req, res) => {
    try {
        const { id } = req.body;

        if (!id) {
            return res.status(400).json({ success: false, message: "User ID is required" });
        }

        // Find user by telegram_id
        const user = await User.findOne({ telegram_id: id });


        const spiner = await Spiner.findOne({});

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Check if user has available spins
        if (user.avaibleSpin <= 0) {
            return res.status(400).json({
                success: false,
                message: "You don't have any available spins"
            });
        }

        // 🎯 Spin value array (no negatives, blanks replaced with 5)
        let spinValues = [
            5, 5, 5, 10, 20, 5, 5, 10, 20, 50,
            5, 5, 5, 10, 20, 5, 10, 20, 50, 100,
            5, 5, 5, 10, 20, 5, 5, 10, 20, 50,
            5, 5, 5, 10, 20, 5, 10, 20, 50, 100,
            5, 5, 5, 10, 20, 5, 10, 20, 50, 200
        ];
        // if (user.completeSpin > 10) {
        //     spinValues = [
        //         5, 5, 5, 10, 20, 5, 5, 10, 20, 50,
        //         5, 5, 5, 10, 20, 5, 10, 20, 50, 100,
        //         5, 5, 5, 10, 20, 5, 5, 10, 20, 50,
        //         5, 5, 5, 10, 20, 5, 10, 20, 50, 100,
        //         5, 5, 5, 10, 20, 5, 10, 20, 50, 200
        //     ];
        // }
        // if (user.completeSpin > 20) {
        //     spinValues = [
        //         5, 5, 5, 10, 20, 5, 5, 10, 20, 50,
        //         5, 5, 5, 10, 20, 5, 10, 20, 50, 100,
        //         5, 5, 5, 10, 20, 5, 5, 10, 20, 50,
        //         5, 5, 5, 10, 20, 5, 10, 20, 50, 100,
        //         5, 5, 5, 10, 20, 5, 10, 20, 50, 200
        //     ];

        // }

        // Calculate spin index based on completed spins
        const spinIndex = spiner.spincount % spinValues.length; // loop if more than 50
        let spinAmount = spinValues[spinIndex];

        const bigPrizes = [50, 100, 200];

        if (bigPrizes.includes(spinAmount)) {
            const winnerdata = await Spinerwinner.findOne({
                tuserId: user.user_id,
                prize: spinAmount
            });

            if (winnerdata) {
                spinAmount = 5; // downgrade to minimum reward if already won
            }
        }


        // 💰 Update user's balance and spin counts
        await User.updateOne(
            { _id: user._id },
            {
                $inc: {
                    avaibleSpin: -1,
                    completeSpin: 1,
                    spinearnBalance: spinAmount,
                    reamingBalance: spinAmount
                }
            }
        );
        let newspin = spiner.spincount == 50 ? 0 : spiner.spincount + 1
        await Spiner.updateOne(
            { _id: spiner._id },

            {
                $set: {
                    spincount: newspin
                }
            }
        )
        await Spinerwinner.create(
            {
                tuserId: user.user_id,
                prize: spinAmount
            }
        )

        return res.status(200).json({
            success: true,
            message: "Spin completed successfully",
            spinAmount
        });

    } catch (error) {
        console.error("Error in /spiner-run:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
});



module.exports = router;
