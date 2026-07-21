const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const multer = require("multer");

const connectDB = require("./config/db");
const { verifySmtpConnection, transporter } = require("./config/nodemailer");

dotenv.config();

// Environment validation
if (!process.env.JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined in the environment.");
  process.exit(1);
}

connectDB();

const app = express();

app.set("trust proxy", 1);

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:5174",
    "http://localhost:4200",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:4200",
    "https://smart-krishi-three.vercel.app"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

app.use("/uploads", express.static("uploads"));

// Diagnostic SMTP test endpoint (Requirement 10 & 11)
app.post("/api/test-email", async (req, res) => {
  const { email } = req.body;
  
  if (!email || email.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "Email recipient address is required."
    });
  }

  // Basic email pattern validate (Requirement 6)
  if (!email.match(/^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,6}$/)) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid email address."
    });
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Smart Krishi - Node.js SMTP Diagnostics Test",
    text: "This is a test email sent to verify Node.js SMTP transporter configuration."
  };

  try {
    console.log(`[DIAGNOSTICS] Hitting diagnostics: sending test email to ${email}`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`[DIAGNOSTICS] Diagnostics test email sent successfully. MessageID: ${info.messageId}`);
    
    res.json({
      success: true,
      message: "SMTP test email sent successfully to " + email,
      response: info.response
    });
  } catch (error) {
    console.error("[DIAGNOSTICS] SMTP diagnostics test connection failed:", error.stack || error);
    res.status(500).json({
      success: false,
      message: "SMTP test connection failed: " + error.message,
    });
  }
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/crops", require("./routes/cropRoutes"));
app.use("/api/machinery", require("./routes/machineryRoutes"));
app.use("/api/milk", require("./routes/milkRoutes"));
app.use("/api/land", require("./routes/landRoutes"));
app.use("/api/tents", require("./routes/tentRoutes"));
app.use("/api/weather", require("./routes/weatherRoutes"));
app.use("/api/fertilizers",require("./routes/fertilizerRoutes"));
app.use("/api/market", require("./routes/marketRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/images", require("./routes/imageRoutes"));

app.get("/", (req, res) => {
  res.send("Smart Krishi Backend Running");
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Global error handling middleware (Never leak sensitive error.stack to client)
app.use((err, req, res, next) => {
  console.error("[GLOBAL ERROR INTERCEPTOR] Error Details:", err.stack || err);
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`,
    });
  }
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error occurred",
  });
});

const PORT = process.env.PORT || 5000;

// Start server after verifying SMTP connection (Requirement 7)
const startServer = async () => {
  await verifySmtpConnection();
  app.listen(PORT, () => {
    console.log(`Server Running on Port ${PORT}`);
  });
};

startServer();
