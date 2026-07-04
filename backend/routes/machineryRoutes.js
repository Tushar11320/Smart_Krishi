const express = require("express");

const router = express.Router();

const {
  addMachine,
  getMachines,
} = require("../controllers/machineryController");

router.post("/", addMachine);
router.get("/", getMachines);

module.exports = router;