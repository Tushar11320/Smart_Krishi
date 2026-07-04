const Milk = require("../models/Milk");

const addMilk = async (req, res) => {
  try {
    const milk = await Milk.create(req.body);

    res.status(201).json(milk);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getMilk = async (req, res) => {
  try {
    const milk = await Milk.find();

    res.json(milk);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  addMilk,
  getMilk,
};