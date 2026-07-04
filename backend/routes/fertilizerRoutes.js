const express = require("express");

const router = express.Router();

const upload = require("../config/multer");

const {
  addProduct,
  getProducts,
} = require("../controllers/fertilizerController");

router.post(
  "/",
  upload.single("image"),
  addProduct
);

router.get("/", getProducts);

module.exports = router;