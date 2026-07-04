const express = require("express");

const router = express.Router();

const {
  addLand,
  getLands,
} = require("../controllers/landController");

router.post("/", addLand);
router.get("/", getLands);

module.exports = router;