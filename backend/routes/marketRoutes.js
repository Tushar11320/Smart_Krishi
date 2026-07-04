const express = require("express");

const router = express.Router();

const {
  addMarketPrice,
  getMarketPrices,
} = require("../controllers/marketController");

router.post("/", addMarketPrice);

router.get("/", getMarketPrices);

module.exports = router;