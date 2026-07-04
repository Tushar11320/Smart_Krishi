const express = require("express");

const router = express.Router();

const {
  createCrop,
  getAllCrops,
} = require("../controllers/cropController");

const {
  protect,
} = require("../middleware/authMiddleware");

router.post("/", protect, createCrop);

router.get("/", getAllCrops);

module.exports = router;