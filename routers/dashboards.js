const { default: axios } = require("axios");
const express = require("express");
const Login = require("../model/Login");
const User = require("../model/User");
const CurrentBlock = require("../model/CurrentBlock");
const DepositHistory = require("../model/Deposithistory");
const Spiner = require("../model/Spiner");
const Spinerwinner = require("../model/Spinerwinner");
const levelIncome = require("../model/levelIncome");
const RankIncomeHistory = require("../model/Rank");




const router = express.Router();
require("dotenv").config();
const env = process.env;

router.get("/ping", (req, res) => {
  res.json({ success: true, message: "Server is running ✅" });
})

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


router.get("/deposithistory/:id", async (req, res) => {
  const userId = req.params.id; // user ID from URL

  try {
    // Find user by telegram ID
    const user = await User.findOne({ user_address: userId });
    if (!user) {
      return res.status(404).json({   // ✅ return is important here
        status: "error",
        message: "User not found",
      });
    }

    // Find deposits only for this user
    const deposits = await DepositHistory.find({ user: userId }).sort({ createdAt: -1 });

    return res.status(200).json({
      status: "success",
      count: deposits.length,
      data: deposits,
    });
  } catch (error) {
    console.error("Error fetching deposit history:", error);
    return res.status(500).json({
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
      .select("user_id username user createdAt");

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

// routes/referral.js
router.get("/referrals/:userId", async (req, res) => {
  try {
    const { userId } = req.params;               // e.g. 0xB5De...

    const root = await User.findOne({ user_address: userId });
    if (!root) return res.status(400).json({ message: "User not found" });

    // ---------- RECURSIVE TREE BUILDER ----------
    const buildTree = async (parentAddr, depth = 0, maxDepth = 6) => {
      if (depth >= maxDepth) return [];

      const children = await User.find({ referral_address: parentAddr })
        .sort({ createdAt: -1 })
        .lean();                              // <-- IMPORTANT

      // Run recursion for every child **in parallel**
      const childrenWithTree = await Promise.all(
        children.map(async (child) => {
          const sub = await buildTree(child.user_address, depth + 1, maxDepth);
          return {
            ...child,
            level: depth + 1,                 // 1 = direct, 2 = level2, …
            children: sub,
          };
        })
      );

      return childrenWithTree;
    };
    // -------------------------------------------

    const tree = await buildTree(userId);

    console.log(`Tree for ${userId} → levels:`, tree.length ? "1+" : "0");
    res.json({ status: "Success", data: tree });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "Error", error: err.message });
  }
});
router.get("/levelIncome", async (req, res) => {
  try {
    const { userId } = req.query;
    // console.log(userId, "userI")
    const userdata = await User.findOne({ user_address: userId })
    if (!userdata) {
      res.status(400).json({ message: "User not found" });
    }
    const levels = await levelIncome.find({ to_user: userId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: levels,
    });
  } catch (err) {
    console.error("Referral fetch error:", err);
    res.status(500).json({ success: false, status: "Server error", error: err.message });
  }
});
router.get("/RankIncome", async (req, res) => {
  try {
    const { user_id } = req.query;
    const userrank = await User.findOne({ user_address: user_id })
    if (!userrank) {
      res.status(400).json({ message: "User not found" });
    }

    const Ranks = await RankIncomeHistory.find({ user: userrank.user_id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: Ranks,
    });
  } catch (err) {
    console.error("Rankincome fetch error:", err);
    res.status(500).json({ success: false, status: "Server error", error: err.message });
  }
});

router.get("/get-spin-data", async (req, res) => {
  try {
    const { userId } = req.query;
    console.log(userId, "userI")
    const user = await User.findOne({ user_address: userId })
    if (!user) {
      res.status(400).json({ success: false, message: "User not found" });
    }
    const userdata = await Spinerwinner.find({ tuserId: user?.user_id })
    // const levels = await levelIncome.find({ to_user: userdata.user_address })
    //     .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: userdata,
    });
  } catch (err) {
    console.error("Referral fetch error:", err);
    res.status(500).json({ success: false, status: "Server error", error: err.message });
  }
});


router.post("/profile", async (req, res) => {
  try {
    const { id } = req.body;
    console.log(id, "req id");

    if (!id) {
      return res.status(400).json({ success: false, message: "User ID or address is required" });
    }

    // Prepare query parameters
    let query = {};

    // If id looks like a wallet address (starts with "0x" and length 42)
    if (typeof id === "string" && id.startsWith("0x") && id.length === 42) {
      query.user_address = id;
    }
    // Otherwise, assume it's a Telegram ID or numeric ID
    else {
      query.telegram_id = id;
    }

    const user = await User.findOne(query);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "User profile fetched successfully",
      data: user,
    });

  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});
router.post("/spiner-run", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ success: false, message: "User ID is required" });

    const user = await User.findOne({ user_address: id });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (user.avaibleSpin <= 0)
      return res.status(400).json({ success: false, message: "No available spins" });

    // 📈 Global spin tracker
    let spiner = await Spiner.findOne({});

    // 🎯 Spin pattern
    const spinValues = [
      5, 5, 5, 10, 20, 5, 5, 10, 20, 50,
      5, 5, 5, 10, 20, 5, 10, 20, 50, 100,
      5, 5, 5, 10, 20, 5, 5, 10, 20, 50,
      5, 5, 5, 10, 20, 5, 10, 20, 50, 100,
      5, 5, 5, 10, 20, 5, 10, 20, 50, 200
    ];

    // 🔢 Determine spin index based on total spins
    const spinIndex = spiner.entry % spinValues.length;
    let spinAmount = spinValues[spinIndex];

    // 🥇 Rule 1: first spin always 5
    if (user.completeSpin === 0) {
      spinAmount = 5;
    } else {
      // 🎯 Rule 2: global limits
      const scale = Math.max(1, Math.floor(spiner.entry / 50));
      // Every 500 spins, increase limits ×1
      const bigPrizeLimits = {
        10: 10 * scale,
        20: 10 * scale,
        50: 5 * scale,
        100: 2 * scale,
        200: 1 * scale,
      };
      if (bigPrizeLimits[spinAmount]) {
        const totalWins = await Spinerwinner.countDocuments({ prize: spinAmount });
        if (totalWins >= bigPrizeLimits[spinAmount]) {
          spinAmount = 5; // downgrade when global limit reached
        }
      }

      // 🚫 Rule 3: prevent user from repeating big wins
      const alreadyBigWin = await Spinerwinner.findOne({
        tuserId: user.user_id,
        prize: { $in: [10, 20, 50, 100, 200] },
      });

      if (alreadyBigWin && [10, 20, 50, 100, 200].includes(spinAmount)) {
        spinAmount = 5; // user already won a big prize once
      }
    }

    // 💰 Rule 4: company-safe (limit based on deposit)
    const deposit = (user.deposit_balance || 0) / 1e18;
    const earned = user.spinearnBalance || 0;
    const remainingLimit = deposit - earned;

    if (spinAmount > remainingLimit) {
      spinAmount = 5;
    }

    // ✅ Update user
    await User.updateOne(
      { _id: user._id },
      {
        $inc: {
          avaibleSpin: -1,
          completeSpin: 1,
          spinearnBalance: spinAmount,
          reamingBalance: spinAmount,
        },
      }
    );

    // 🏅 Save spin result
    await Spinerwinner.create({
      tuserId: user.user_id,
      prize: spinAmount,
    });

    res.status(200).json({
      success: true,
      message: "Spin completed successfully",
      spinAmount,
    });

  } catch (error) {
    console.error("Error in /spiner-run:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

function generateUserId() {
  const randomNum = Math.floor(1000000 + Math.random() * 9000000); // 7 digits
  return `MEJ${randomNum}`;
}
router.post("/register", async (req, res) => {
  try {
    const { walletAddress, referral_address } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        status: false,
        message: "Wallet address is required",
      });
    }

    const normalizedWallet = walletAddress

    // ✅ Check if wallet already exists
    const existingUser = await User.findOne({ user_address: normalizedWallet });
    if (existingUser) {
      return res.status(200).json({
        status: false,
        message: "User already registered",
        user: existingUser,
      });
    }

    // ✅ Check for referral validity
    let refUser = null;
    if (referral_address) {
      const normalizedReferral = referral_address;
      refUser = await User.findOne({ user_address: normalizedReferral });
      if (!refUser) {
        return res.status(400).json({
          status: false,
          message: "Invalid referral address",
        });
      }
    }

    // ✅ Generate unique user_id
    let newUserId;
    let isUnique = false;
    while (!isUnique) {
      newUserId = generateUserId();
      const check = await User.findOne({ user_id: newUserId });
      if (!check) isUnique = true;
    }

    // ✅ Create new user
    const newUser = new User({
      user_id: newUserId,
      username: "Wallet User",
      telegram_id: newUserId, // optional
      user_address: normalizedWallet,
      referrer_id: refUser ? refUser.user_id : null,
      referral_address: refUser ? refUser.user_address : null,
      createdAt: new Date(),
    });

    await newUser.save();

    return res.status(200).json({
      status: true,
      message: "User registered successfully",
      user: newUser,
    });
  } catch (error) {
    console.error("Error in register API:", error);
    return res.status(500).json({
      status: false,
      message: "Server error",
      error: error.message,
    });
  }
});


router.post("/getUserData", async (req, res) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        message: "Wallet address is required",
      });
    }

    const user = await User.findOne({ user_address: walletAddress });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    console.error("Referral fetch error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
});

module.exports = router;
