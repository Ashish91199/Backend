const AdminCred = require("../model/AdminCred");

const express = require("express");
const User = require("../model/User");
const Deposithistory = require("../model/Deposithistory");
const Spinerwinner = require("../model/Spinerwinner");
const levelIncome = require("../model/levelIncome");
const RankIncomeHistory = require("../model/Rank");
const withdrawReward = require("../model/withdrawReward");
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
router.get("/deposit", async (req, res) => {
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

        const deposit = await Deposithistory.find(filter)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: 1 });

        const totalDocs = await Deposithistory.countDocuments(filter);
        const totalDeposits = await Deposithistory.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: { $toDouble: "$depositAmt" } }
                }
            }
        ])

        // Response
        return res.status(200).json({
            status: "Success",
            data: {
                deposit,
                currentPage: page,
                totalPages: Math.ceil(totalDocs / limit),
                totalDeposits: totalDeposits[0].total || 0,
                totalDocs
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

router.get("/totalSpinner", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search ? req.query.search.trim() : "";
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;

        const match = {};

        // 🔹 Apply search filter
        if (search) {
            match.tuserId = { $regex: search, $options: "i" };
        }

        // 🔹 Apply date range filter (if provided)
        if (startDate && endDate) {
            match.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
            };
        } else if (startDate) {
            match.createdAt = { $gte: new Date(startDate) };
        } else if (endDate) {
            match.createdAt = {
                $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
            };
        }

        const skip = (page - 1) * limit;

        // 🔹 Grouped and paginated
        const groupedData = await Spinerwinner.aggregate([
            { $match: match },
            {
                $group: {
                    _id: "$tuserId",
                    spins: { $push: "$$ROOT" },
                    totalPrize: { $sum: "$prize" },
                    totalSpins: { $sum: 1 },
                },
            },
            { $sort: { "_id": 1 } },
            { $skip: skip },
            { $limit: limit },
        ]);

        const totalUsers = await Spinerwinner.distinct("tuserId", match);

        // 🔹 Filtered total stats
        const filteredTotals = await Spinerwinner.aggregate([
            { $match: match },
            {
                $group: {
                    _id: null,
                    totalPrize: { $sum: "$prize" },
                    totalSpins: { $sum: 1 },
                },
            },
        ]);

        return res.status(200).json({
            status: "Success",
            data: {
                users: groupedData,
                totalUsers: totalUsers.length,
                totalPages: Math.ceil(totalUsers.length / limit),
                totalPrize: filteredTotals[0]?.totalPrize || 0,
                totalSpins: filteredTotals[0]?.totalSpins || 0,
            },
        });
    } catch (err) {
        console.error("Error fetching spinner data:", err);
        res.status(500).json({
            status: "Server error",
            error: err.message,
        });
    }
});


// router.get("/dashboard-data", async (req, res) => {
//     try {
//         const [totalactiveuser, totalinactiveuser, totalentry, totalDeposit, totalSpinner, totalWinnerSpinner, spinnerWinnerData, levelIncomedata, rankIncomeData] = await Promise.all([
//             User.countDocuments({ entry: { $gt: 0 } }),
//             User.countDocuments({ entry: 0 }),

//             Deposithistory.countDocuments(),

//             Deposithistory.aggregate([
//                 {
//                     $group: {
//                         _id: null,
//                         total: { $sum: { $toDouble: "$depositAmt" } }
//                     }
//                 }
//             ]),
//             User.aggregate([
//                 {
//                     $group: {
//                         _id: null,
//                         total: { $sum: { $toDouble: "$avaibleSpin" } }
//                     }
//                 }
//             ]),
//             User.aggregate([
//                 {
//                     $group: {
//                         _id: null,
//                         total: { $sum: { $toDouble: "$completeSpin" } }
//                     }
//                 }

//             ]),

//             Spinerwinner.aggregate([
//                 {
//                     $group: {
//                         _id: null,
//                         total: { $sum: { $toDouble: "$prize" } }
//                     }
//                 }

//             ]),
//             levelIncome.aggregate([
//                 {
//                     $group: {
//                         _id: null,
//                         total: { $sum: { $toDouble: "$amount" } }
//                     }
//                 }

//             ]),
//             RankIncomeHistory.aggregate([
//                 {
//                     $group: {
//                         _id: null,
//                         total: { $sum: { $toDouble: "$receivedAmount" } }
//                     }
//                 }

//             ]),




//         ])
//         return res.status(200).json({
//             status: "Success",
//             data: {
//                 totalactiveuser,
//                 totalinactiveuser,
//                 totalentry,
//                 companymargin: totalentry * 5,
//                 totalDeposit: totalDeposit[0].total || 0,
//                 totalSpinner: totalSpinner[0].total || 0,
//                 totalWinnerSpinner: totalWinnerSpinner[0].total || 0,
//                 Spinerwinner: spinnerWinnerData[0]?.total || 0,
//                 levelIncome: levelIncomedata[0]?.total || 0,
//                 rankIncome: rankIncomeData[0]?.total || 0,

//             },
//         });
//     } catch (err) {
//         console.error("Error fetching users:", err);
//         res.status(500).json({
//             status: "Server error",
//             error: err.message,
//         });
//     }
// });
router.get("/dashboard-data", async (req, res) => {
    try {
        const { filter } = req.query; // today | month | all
        let dateFilter = null; // 🧠 agar null hoga toh "till date" ka data aayega (sab data)

        // 🗓️ Filter logic
        if (filter === "today") {
            const start = new Date();
            start.setHours(0, 0, 0, 0);
            const end = new Date();
            end.setHours(23, 59, 59, 999);
            dateFilter = { createdAt: { $gte: start, $lte: end } };
        } else if (filter === "month") {
            const start = new Date();
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
            const end = new Date();
            end.setMonth(end.getMonth() + 1);
            end.setDate(0);
            end.setHours(23, 59, 59, 999);
            dateFilter = { createdAt: { $gte: start, $lte: end } };
        }
        // agar "all" ya "till date" ho, toh koi dateFilter nahi lagayenge

        // agar filter lagana ho toh hi matchStage me $match add hoga
        const matchStage = dateFilter ? [{ $match: dateFilter }] : [];

        // 🔹 Parallel queries
        const [
            totalactiveuser,
            totalinactiveuser,
            totalentry,
            totalDeposit,
            totalSpinner,
            totalWinnerSpinner,
            spinnerWinnerData,
            levelIncomedata,
            rankIncomeData,
        ] = await Promise.all([
            dateFilter
                ? User.countDocuments({ entry: { $gt: 0 }, ...dateFilter })
                : User.countDocuments({ entry: { $gt: 0 } }),

            dateFilter
                ? User.countDocuments({ entry: 0, ...dateFilter })
                : User.countDocuments({ entry: 0 }),

            dateFilter
                ? Deposithistory.countDocuments(dateFilter)
                : Deposithistory.countDocuments(),

            Deposithistory.aggregate([
                ...matchStage,
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $toDouble: "$depositAmt" } },
                    },
                },
            ]),

            User.aggregate([
                ...matchStage,
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $toDouble: "$avaibleSpin" } },
                    },
                },
            ]),

            User.aggregate([
                ...matchStage,
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $toDouble: "$completeSpin" } },
                    },
                },
            ]),

            Spinerwinner.aggregate([
                ...matchStage,
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $toDouble: "$prize" } },
                    },
                },
            ]),

            levelIncome.aggregate([
                ...matchStage,
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $toDouble: "$amount" } },
                    },
                },
            ]),

            RankIncomeHistory.aggregate([
                ...matchStage,
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $toDouble: "$receivedAmount" } },
                    },
                },
            ]),
        ]);

        // ✅ response
        return res.status(200).json({
            status: "Success",
            data: {
                totalactiveuser,
                totalinactiveuser,
                totalentry,
                companymargin: totalentry * 5,
                totalDeposit: totalDeposit[0]?.total || 0,
                totalSpinner: totalSpinner[0]?.total || 0,
                totalWinnerSpinner: totalWinnerSpinner[0]?.total || 0,
                Spinerwinner: spinnerWinnerData[0]?.total || 0,
                levelIncome: levelIncomedata[0]?.total || 0,
                rankIncome: rankIncomeData[0]?.total || 0,
            },
        });
    } catch (err) {
        console.error("Error fetching dashboard data:", err);
        res.status(500).json({
            status: "Server error",
            error: err.message,
        });
    }
});
router.get("/withdraw-history", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search ? req.query.search.trim() : "";
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;

        const match = {};

        // 🔹 Search filter (by address or key)
        if (search) {
            match.$or = [
                { userAddress: { $regex: search, $options: "i" } },
                { key: { $regex: search, $options: "i" } }
            ];
        }

        // 🔹 Date filter
        if (startDate && endDate) {
            match.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
            };
        } else if (startDate) {
            match.createdAt = { $gte: new Date(startDate) };
        } else if (endDate) {
            match.createdAt = {
                $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
            };
        }

        const skip = (page - 1) * limit;

        // 🔹 Paginated data
        const historyData = await withdrawReward.find(match)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalRecords = await withdrawReward.countDocuments(match);

        // 🔹 Total Amount Withdrawn
        const totalStats = await withdrawReward.aggregate([
            { $match: match },
            {
                $group: {
                    _id: null,
                    totalAmount: {
                        $sum: { $toDouble: "$amount" }
                    },
                },
            },
        ]);

        res.status(200).json({
            status: "Success",
            data: {
                history: historyData,
                totalRecords,
                totalPages: Math.ceil(totalRecords / limit),
                totalWithdrawAmount: totalStats[0]?.totalAmount || 0,
            },
        });
    } catch (err) {
        console.error("Error fetching withdraw history:", err);
        res.status(500).json({
            status: "Server error",
            error: err.message,
        });
    }
});
router.get("/RankIncome", async (req, res) => {
    try {
        const { user_id } = req.query;

        let filter = {};

        // 🟢 Agar specific user ka data chahiye
        if (user_id) {
            const user = await User.findOne({ user_address: user_id });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }

            filter.user_id = user.user_id; // filter for that user only
        }

        // 🟢 Agar user_id nahi diya gaya — sabhi users ka data show kare
        const rankRecords = await RankIncomeHistory.find(filter).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            totalRecords: rankRecords.length,
            data: rankRecords,
        });

    } catch (err) {
        console.error("RankIncome fetch error:", err);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: err.message,
        });
    }
});

module.exports = router;




