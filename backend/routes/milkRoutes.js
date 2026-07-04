const express = require("express");

const router = express.Router();

const {
  addMilk,
  getMilk,
} = require("../controllers/milkController");

router.post("/", addMilk);
router.get("/", getMilk);

module.exports = router;