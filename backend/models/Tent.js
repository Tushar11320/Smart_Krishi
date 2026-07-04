const mongoose = require("mongoose");

const tentSchema = new mongoose.Schema(
  {
    tentName: String,
    price: Number,
    location: String,
    image: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Tent", tentSchema);