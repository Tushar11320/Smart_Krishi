const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const path = require("path");

// Ensure dotenv is configured to load the correct .env file
dotenv.config({ path: path.join(__dirname, "../.env") });

// Check that environment variables exist and are not empty (Requirement 2 & 3)
const requiredEnv = ["EMAIL_HOST", "EMAIL_PORT", "EMAIL_USER", "EMAIL_PASSWORD", "EMAIL_FROM"];
let smtpConfigValid = true;

for (const envVar of requiredEnv) {
  if (!process.env[envVar] || process.env[envVar].trim() === "") {
    console.warn(`WARNING: Environment variable ${envVar} is missing or empty in .env. SMTP will not be fully functional.`);
    smtpConfigValid = false;
  }
}

// Detect placeholder values (Requirement 4)
if (smtpConfigValid) {
  const placeholders = ["your_app_password", "password", "changeme", "example", "test123", "your_email@example.com"];
  for (const envVar of requiredEnv) {
    const val = process.env[envVar].toLowerCase();
    if (placeholders.some(p => val.includes(p))) {
      console.warn(`WARNING: Environment variable ${envVar} contains a placeholder value ("${process.env[envVar]}"). Please configure valid SMTP settings.`);
      smtpConfigValid = false;
    }
  }
}

// Ensure Gmail uses a valid 16-character App Password (excluding whitespaces) (Requirement 6)
if (smtpConfigValid && process.env.EMAIL_HOST === "smtp.gmail.com") {
  const cleanPassword = process.env.EMAIL_PASSWORD.replace(/\s+/g, "");
  if (cleanPassword.length !== 16) {
    console.warn(`WARNING: Gmail SMTP requires a 16-character App Password (e.g., "abcd efgh ijkl mnop"). The provided password is invalid.`);
    smtpConfigValid = false;
  }
}

// Add detailed logging: Environment variables loaded (mask password) (Requirement 9)
console.log("[SMTP CONFIG] Loaded SMTP Configurations:");
console.log(`- EMAIL_HOST: ${process.env.EMAIL_HOST || "not set"}`);
console.log(`- EMAIL_PORT: ${process.env.EMAIL_PORT || "not set"}`);
console.log(`- EMAIL_USER: ${process.env.EMAIL_USER || "not set"}`);
console.log(`- EMAIL_FROM: ${process.env.EMAIL_FROM || "not set"}`);
console.log(`- EMAIL_PASSWORD: ****************`);

// Create Nodemailer Transporter (Requirement 5)
let transporter = null;
if (smtpConfigValid) {
  try {
    transporter = nodemailer.createTransport({
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
  } catch (error) {
    console.warn(`WARNING: Failed to create SMTP transporter: ${error.message}`);
    smtpConfigValid = false;
  }
} else {
  console.warn("WARNING: SMTP configuration is invalid or incomplete. Transporter will not be initialized.");
}

// SMTP transporter verification helper (Requirement 7)
const verifySmtpConnection = async () => {
  if (!transporter || !smtpConfigValid) {
    console.warn("[SMTP CONNECTION] SMTP transporter is not initialized due to missing or invalid config. Skipping verification.");
    return;
  }
  try {
    console.log("[SMTP CONNECTION] Verifying SMTP connection using transporter.verify()...");
    await transporter.verify();
    console.log("[SMTP CONNECTION] SMTP connection verified successfully.");
  } catch (error) {
    console.warn("WARNING: SMTP transporter connection verification failed during startup!");
    console.warn(`Error Code: ${error.code}`);
    console.warn(`Error Message: ${error.message}`);
  }
};

module.exports = {
  transporter,
  verifySmtpConnection,
};
