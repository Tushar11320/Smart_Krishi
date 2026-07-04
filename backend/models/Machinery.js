const mongoose = require("mongoose");

const machinerySchema = new mongoose.Schema(
  {
    machineName: String,
    rentPrice: Number,
    available: Boolean,
    image: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Machinery",
  machinerySchema
);