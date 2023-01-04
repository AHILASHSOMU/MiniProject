const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    // trim: true,
    required: true,
  },
  isAvailable: {
    type: Number,
    default: 1,
  },
});

module.exports = mongoose.model("Category", categorySchema);
