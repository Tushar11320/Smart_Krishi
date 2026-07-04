const Crop = require("../models/Crop");

const createCrop = async (req, res) => {
  try {
    const crop = await Crop.create(req.body);

    res.status(201).json(crop);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getAllCrops = async (req, res) => {
  try {
    const crops = await Crop.find();

    res.json(crops);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createCrop,
  getAllCrops,
};