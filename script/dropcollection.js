// script/dropcollection.js
const mongoose = require("mongoose");
require("dotenv").config({ path: "../.env" });

async function dropCollectionsExceptConfig() {
  const env = process.env;
  const uri = `mongodb+srv://${env.MONGODB_USER}:${env.MONGODB_PASSWORD}@${env.MONGODB_HOST}/${env.MONGODB_DB}?retryWrites=true&w=majority&appName=Opnix`;

  try {
    await mongoose.connect(uri, { dbName: env.MONGODB_DB });
    console.log("Using DB:", mongoose.connection.db.databaseName);

    const collections = await mongoose.connection.db.collections();
    console.log(
      "Collections found:",
      collections.map((c) => c.collectionName)
    );

    for (const collection of collections) {
      if (collection.collectionName !== "configs") {
        console.log(`Dropping collection: ${collection.collectionName}`);
        await collection.drop();
      }
    }

    console.log("Selected collections have been dropped.");
  } catch (error) {
    console.error("Error dropping collections:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

dropCollectionsExceptConfig();
