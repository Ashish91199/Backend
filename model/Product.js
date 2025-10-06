// models/Product.js
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    productName: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true
    },
    width: {
        type: Number,
        required: true
    }
}, { timestamps: true }); // createdAt & updatedAt automatically

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
