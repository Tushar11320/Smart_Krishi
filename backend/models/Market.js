const mongoose = require("mongoose");

const marketSchema = new mongoose.Schema(
  {
    cropName: String,
    marketPrice: Number,
    mandi: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Market",
  marketSchema
);