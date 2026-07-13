const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const path = require("path");

// Ensure dotenv is configured to load the correct .env file
dotenv.config({ path: path.join(__dirname, "../.env") });

// Check that environment variables exist and are not empty (Requirement 2 & 3)
const requiredEnv = ["EMAIL_HOST", "EMAIL_PORT", "EMAIL_USER", "EMAIL_PASSWORD", "EMAIL_FROM"];
for (const envVar of requiredEnv) {
  if (!process.env[envVar] || process.env[envVar].trim() === "") {
    console.error(`FATAL ERROR: Environment variable ${envVar} is missing or empty in .env.`);
    process.exit(1);
  }
}

// Detect placeholder values (Requirement 4)
const placeholders = ["your_app_password", "password", "changeme", "example", "test123", "your_email@example.com"];
for (const envVar of requiredEnv) {
  const val = process.env[envVar].toLowerCase();
  if (placeholders.some(p => val.includes(p))) {
    console.error(`FATAL ERROR: Environment variable ${envVar} contains a placeholder value ("${process.env[envVar]}"). Please configure valid SMTP settings.`);
    process.exit(1);
  }
}

// Ensure Gmail uses a valid 16-character App Password (excluding whitespaces) (Requirement 6)
if (process.env.EMAIL_HOST === "smtp.gmail.com") {
  const cleanPassword = process.env.EMAIL_PASSWORD.replace(/\s+/g, "");
  if (cleanPassword.length !== 16) {
    console.error(`FATAL ERROR: Gmail SMTP requires a 16-character App Password (e.g., "abcd efgh ijkl mnop"). The provided password "${process.env.EMAIL_PASSWORD}" is invalid.`);
    process.exit(1);
  }
}

// Add detailed logging: Environment variables loaded (mask password) (Requirement 9)
console.log("[SMTP CONFIG] Loaded SMTP Configurations:");
console.log(`- EMAIL_HOST: ${process.env.EMAIL_HOST}`);
console.log(`- EMAIL_PORT: ${process.env.EMAIL_PORT}`);
console.log(`- EMAIL_USER: ${process.env.EMAIL_USER}`);
console.log(`- EMAIL_FROM: ${process.env.EMAIL_FROM}`);
console.log(`- EMAIL_PASSWORD: ****************`);

// Create Nodemailer Transporter (Requirement 5)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10),
  secure: process.env.EMAIL_PORT === "465", // secure connection for port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    // secure settings
    rejectUnauthorized: true,
  },
});

// SMTP transporter verification helper (Requirement 7)
const verifySmtpConnection = async () => {
  try {
    console.log("[SMTP CONNECTION] Verifying SMTP connection using transporter.verify()...");
    await transporter.verify();
    console.log("[SMTP CONNECTION] SMTP connection verified successfully.");
  } catch (error) {
    console.error("FATAL ERROR: SMTP transporter connection verification failed during startup!");
    console.error(`Error Code: ${error.code}`);
    console.error(`Error Message: ${error.message}`);
    console.error("Stack Trace:");
    console.error(error.stack);
    process.exit(1);
  }
};

module.exports = {
  transporter,
  verifySmtpConnection,
};
