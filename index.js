require("dotenv").config();
require("./connection");
const Web3 = require("web3");
const express = require("express");
const cors = require("cors");
const app = express();
const path = require("path");
const config = require("./model/config");
const dashboards = require("./routers/dashboards");
const adminlogin = require("./routers/adminlogin");


app.use(express.json());

app.use(
  cors({
    origin: function (origin, callback) {
      callback(null, true);
    },
  })
);

// app.use("/api", routes);
app.use("/api/opnix/admin", adminlogin);
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


const server = app.listen(8001, () => {
  console.log("Server running!");
});
