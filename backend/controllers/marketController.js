const Market = require("../models/Market");

const addMarketPrice = async (req, res) => {
  try {
    const market = await Market.create(
      req.body
    );

    res.status(201).json(market);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getMarketPrices = async (
  req,
  res
) => {
  try {
    const data = await Market.find();

    res.json(data);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  addMarketPrice,
  getMarketPrices,
};