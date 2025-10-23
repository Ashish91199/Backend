require("dotenv").config();
require("./connection");
const Web3 = require("web3");
const express = require("express");
const cron = require("node-cron");
const cors = require("cors");
const app = express();
const path = require("path");
const config = require("./model/config");
const dashboards = require("./routers/dashboards");
const adminlogin = require("./routers/adminlogin");
const TelegramBot = require('node-telegram-bot-api');
const User = require("./model/User");
const { connect } = require("http2");
const { getWeb3Data } = require('./indexer');
const { distributeLevelIncome, cronRankCheck, distrbuteRank } = require("./helper");
// const { distributeBonusPool } = require("./helper")

const token = process.env.TELEGRAM_TOKEN; // Replace with your actual bot token
const bot = new TelegramBot(token, { polling: true });



// ✅ Function: Generate Random User ID (MEJ + 7 digits)
function generateUserId() {
  const randomNum = Math.floor(1000000 + Math.random() * 9000000); // 7 digits
  return `MEJ${randomNum}`;
}

// ✅ /start command
bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const username = msg.from.first_name || msg.from.username || "User";
  const referrerId = match[1] ? match[1].trim() : null;

  try {
    let existingUser = await User.findOne({ telegram_id: chatId.toString() });

    if (existingUser) {
      bot.sendMessage(chatId, `Welcome back, ${username}! 👋\nYour User ID: ${existingUser.user_id}`);
      return;
    }

    let refUser = await User.findOne({ telegram_id: referrerId.toString() });

    if (!refUser) {
      bot.sendMessage(chatId, `This referreal not found`);
      return;
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
      username: username,
      telegram_id: chatId.toString(),
      referrer_id: refUser.user_id,
      referral_address: refUser.user_address ? refUser.user_address : "No referral",
    });

    await newUser.save();

    // ✅ Welcome Messages
    bot.sendMessage(chatId, `🎉 Get Ready to Start Your New Journey!`);
    bot.sendMessage(chatId, `Welcome to Mejora Bot, ${username}!`);
    bot.sendMessage(chatId, `✅ Your Unique User ID: ${newUserId}`);

    if (referrerId) {
      bot.sendMessage(chatId, `You joined with referral: ${referrerId}`);
    }

  } catch (error) {
    console.error("Error in /start:", error);
    bot.sendMessage(chatId, "⚠️ An error occurred. Please try again later.");
  }
});

app.use(express.json());

app.use(
  cors({
    origin: function (origin, callback) {
      callback(null, true);
    },
  })
);

// app.use("/api", routes);
app.use("/api", adminlogin);
app.use("/api", dashboards);
// app.use("/banner", express.static(path.join(__dirname, "/public/upload")));

const web3 = new Web3(
  new Web3.providers.HttpProvider(process.env.RPC_URL, {
    reconnect: {
      auto: true,
      delay: 5000,
      maxAttempts: 15,
      onTimeout: false,
    },
  })
);
// connect()
//   .then(() => {
//     console.log("Database connected successfully");
//     app.listen(port, () => {
//       console.log("App is listening at port", port);


setInterval(() => {
  getWeb3Data("BNB");

}, 10000);


// directLevelIncome();s
// cron.schedule("* * * *  *", async () => {
//   try {
//     await directLevelIncome();
//     console.log("Direct Level Income Cron");

//   } catch (err) {
//     console.log("Error in cron", err);
//   }
// })

// cron.schedule("0 10 * * *", async () => {
//   console.log("⏰ Running Bonus Pool Distribution at 10:00 AM");
//   await distributeBonusPool(4); // हर entry पर $4
// });
cron.schedule("*/10 * * * *", async () => {
  await cronRankCheck();
});

cron.schedule("0 11 * * *", async () => {
  console.log("🕓 Running daily rank income distribution (10:00 AM)...");
  await distrbuteRank();
});



const server = app.listen(8001, async () => {
  console.log("Server running!");
  // await distrbuteRank();

  // await distributeLevelIncome("0xA6B2E3376Ea5A1A75a585cDdFC1520BDc2f7958c", 50)
  // await distributeReferralIncome("MEJ3875905", 5);

});
