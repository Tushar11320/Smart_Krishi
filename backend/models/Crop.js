const mongoose = require("mongoose");

const cropSchema = new mongoose.Schema(
  {
    cropName: String,
    fertilizer: String,
    disease: String,
    season: String,
    waterRequirement: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Crop", cropSchema);