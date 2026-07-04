const express = require("express");

const router = express.Router();

const upload = require("../config/multer");

const {
  addTent,
  getTents,
} = require("../controllers/tentController");

router.post(
  "/",
  upload.single("image"),
  addTent
);

router.get("/", getTents);

module.exports = router;