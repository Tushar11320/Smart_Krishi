const Tent = require("../models/Tent");

const addTent = async (req, res) => {
  try {
    const {
      tentName,
      price,
      location,
    } = req.body;

    const tent = await Tent.create({
      tentName,
      price,
      location,
      image: req.file
        ? req.file.filename
        : "",
    });

    res.status(201).json(tent);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getTents = async (req, res) => {
  try {
    const tents = await Tent.find();

    res.json(tents);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  addTent,
  getTents,
};