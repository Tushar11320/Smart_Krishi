const multer = require("multer");
const path = require("path");
const fs = require("fs");
const os = require("os");

// Vercel has read-only filesystem except for /tmp.
const isVercel = process.env.VERCEL || process.env.NOW_BUILDER;
const uploadDir = isVercel ? os.tmpdir() : path.join(__dirname, "../uploads");

if (!isVercel && !fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|gif|webp/;
  const mimetype = allowedExtensions.test(file.mimetype);
  const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error("Only images of format JPG, JPEG, PNG, GIF, or WEBP are allowed!"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5 // 5MB limit
  }
});

module.exports = upload;
