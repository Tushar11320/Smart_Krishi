const mongoose = require("mongoose");

const milkSchema = new mongoose.Schema(
  {
    sellerName: String,
    quantity: Number,
    price: Number,
    location: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Milk", milkSchema);