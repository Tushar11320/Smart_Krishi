const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { transporter } = require("../config/nodemailer");

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    {
      expiresIn: "30d",
    }
  );
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate 6 digit OTP (Requirement 8)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    console.log(`[OTP GENERATION] Register request received for: ${email}`);
    console.log(`[OTP GENERATION] Generated OTP: ${otp}`);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      otpCode: otp,
      otpExpiry: otpExpiry,
      emailVerified: false,
    });

    // Save OTP and user in database (Requirement 8)
    await user.save();
    console.log(`[DATABASE] User and OTP saved successfully for ${email}`);

    // Send email using transporter.sendMail() (Requirement 8 & 9)
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Smart Krishi - Verification Code",
      html: `<h2>Welcome to Smart Krishi!</h2>
             <p>Thank you for registering with us. To activate your account, please verify your email address using the following 6-digit OTP:</p>
             <h3 style="background-color:#f4f4f4;padding:12px;display:inline-block;letter-spacing:5px;font-size:24px;border-radius:5px;color:#16a34a;">${otp}</h3>
             <p>This code is valid for <strong>10 minutes</strong>. If you did not request this code, please ignore this email.</p>
             <br/><p>Grow Smart, Live Better!</p><p>Smart Krishi Team</p>`
    };

    console.log(`[SMTP] Sending OTP email to recipient: ${email}`);
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`[SMTP] Email sent successfully. MessageID: ${info.messageId}`);
      console.log(`[SMTP] Response: ${info.response}`);
      console.log("[SPAM FOLDER WARNING] Warn recipient to check junk/spam folders.");

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
        message: "OTP Sent Successfully"
      });
    } catch (mailError) {
      console.error(`[SMTP] Failed to send email to ${email}. Error Stack:`, mailError);
      
      // Rollback database record (Requirement 8)
      await User.deleteOne({ _id: user._id });
      console.log(`[DATABASE] Rolled back user registration for ${email} due to email delivery failure`);

      return res.status(500).json({
        message: "Email delivery failed. SMTP Error: " + mailError.message,
        error: mailError.stack
      });
    }
  } catch (error) {
    console.error("[REGISTRATION ERROR] Error during user registration:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid Email or Password",
      });
    }

    // Require verification (Requirement 8)
    if (!user.emailVerified) {
      return res.status(400).json({
        message: "Account is inactive. Please verify your email first.",
      });
    }

    if (await bcrypt.compare(password, user.password)) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({
        message: "Invalid Email or Password",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otpCode } = req.body;

    if (!email || !otpCode) {
      return res.status(400).json({ message: "Email and OTP code are required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: "Account is already verified" });
    }

    if (!user.otpCode || !user.otpExpiry) {
      return res.status(400).json({ message: "No active OTP found. Please request a new code." });
    }

    if (new Date() > user.otpExpiry) {
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    if (user.otpCode !== otpCode) {
      return res.status(400).json({ message: "Invalid OTP code" });
    }

    user.emailVerified = true;
    user.otpCode = undefined;
    user.otpExpiry = undefined;
    await user.save();

    console.log(`[OTP VERIFICATION] Email verified successfully for: ${email}`);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
      message: "Email verified and account activated successfully"
    });
  } catch (error) {
    console.error("[OTP VERIFICATION ERROR] Error during verification:", error);
    res.status(500).json({ message: error.message });
  }
};

const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: "Account is already verified" });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otpCode = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    console.log(`[OTP RESEND] Generated new OTP: ${otp} for ${email}`);

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Smart Krishi - Verification Code",
      html: `<h2>Welcome to Smart Krishi!</h2>
             <p>Here is your new OTP verification code:</p>
             <h3 style="background-color:#f4f4f4;padding:12px;display:inline-block;letter-spacing:5px;font-size:24px;border-radius:5px;color:#16a34a;">${otp}</h3>
             <p>This code is valid for <strong>10 minutes</strong>.</p>`
    };

    console.log(`[SMTP] Resending OTP email to recipient: ${email}`);
    try {
      await transporter.sendMail(mailOptions);
      console.log(`[SMTP] Resent OTP successfully to ${email}`);
      res.json({ message: "OTP Sent Successfully" });
    } catch (mailError) {
      console.error(`[SMTP] Resend failed for ${email}. Error Stack:`, mailError);
      res.status(500).json({
        message: "Email delivery failed. SMTP Error: " + mailError.message,
        error: mailError.stack
      });
    }
  } catch (error) {
    console.error("[OTP RESEND ERROR] Error during OTP resend:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  verifyOtp,
  resendOtp,
};