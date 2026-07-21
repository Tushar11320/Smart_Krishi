const express = require("express");
const router = express.Router();
const upload = require("../config/multer");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Upload to cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "smartkrishi",
    });

    // Remove file locally
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.json({
      secureUrl: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.error("[IMAGE UPLOAD ROUTE ERROR] Error uploading image:", error.stack || error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      message: "Failed to upload image to Cloudinary: " + error.message,
    });
  }
});

module.exports = router;
