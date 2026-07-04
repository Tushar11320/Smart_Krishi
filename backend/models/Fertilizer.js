const mongoose = require("mongoose");

const fertilizerSchema =
  new mongoose.Schema(
    {
      productName: String,
      price: Number,
      quantity: String,
      image: String,
    },
    {
      timestamps: true,
    }
  );

module.exports = mongoose.model(
  "Fertilizer",
  fertilizerSchema
);