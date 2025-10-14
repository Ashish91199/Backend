const AdminCred = require("../model/AdminCred");

const express = require("express");
const User = require("../model/User");
const router = express.Router();


router.post("/adminLogin", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ status: false, message: "All fields are required" });
        }

        // Find admin by email
        const admin = await AdminCred.findOne({ email });
        if (!admin) {
            return res.status(404).json({ status: false, message: "Admin not found" });
        }

        if (password !== admin.password) {
            return res.status(401).json({ status: false, message: "Invalid password" });
        }

        // Success
        return res.json({
            status: true,
            message: "Login successful",

        });
    } catch (error) {
        console.error("Admin login error:", error);
        return res.status(500).json({ status: false, message: "Server error" });
    }
});

router.get("/Users", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search ? req.query.search.trim() : "";

        const filter = search
            ? {
                $or: [
                    { username: { $regex: search, $options: "i" } },
                    { user_id: { $regex: search, $options: "i" } },
                    { user_address: { $regex: search, $options: "i" } },
                ],
            }
            : {};

        const skip = (page - 1) * limit;

        const users = await User.find(filter)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: 1 });

        const totalUsers = await User.countDocuments(filter);

        // Response
        return res.status(200).json({
            status: "Success",
            data: {
                users,
                totalUsers,
                currentPage: page,
                totalPages: Math.ceil(totalUsers / limit),
            },
        });
    } catch (err) {
        console.error("Error fetching users:", err);
        res.status(500).json({
            status: "Server error",
            error: err.message,
        });
    }
});



module.exports = router;




