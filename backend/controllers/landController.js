const Land = require("../models/Land");

const addLand = async (req, res) => {
  try {
    const land = await Land.create(req.body);

    res.status(201).json(land);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getLands = async (req, res) => {
  try {
    const lands = await Land.find();

    res.json(lands);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  addLand,
  getLands,
};
