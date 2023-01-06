const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  productname: {
    type: String,
    required: true,
  },
  sales: {
    type: Number,
    default: 0,
  },
  category: {
    type: String,
    required: true,
  },
  stock: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
  },
  image: {
    type: Array,
  },
  isAvailable: {
    type: Number,
    default: 1,
  },
});

module.exports = mongoose.model("Product", productSchema);
