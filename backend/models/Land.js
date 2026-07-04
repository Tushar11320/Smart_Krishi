const mongoose = require("mongoose");

const landSchema = new mongoose.Schema(
  {
    title: String,
    location: String,
    area: String,
    price: Number,
    image: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Land", landSchema);