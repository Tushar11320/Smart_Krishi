const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { transporter } = require("../config/nodemailer");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");

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
    const { firstName, lastName, email, phone, password, confirmPassword, userType } = req.body;

    // 1. Required fields check
    if (!firstName || !lastName || !email || !phone || !password || !confirmPassword || !userType) {
      // Clean up uploaded file if validation fails
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: "All fields are required" });
    }

    // 2. Passwords matching check
    if (password !== confirmPassword) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // 3. Email validation
    const emailRegex = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,6}$/;
    if (!emailRegex.test(email)) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: "Please enter a valid email address" });
    }

    // 4. Strong password check
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#%^()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d@$!%*?&#%^()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/;
    if (!passwordRegex.test(password)) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character."
      });
    }

    // 5. Phone number validation
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phoneRegex.test(phone)) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: "Please enter a valid phone number (10-15 digits)" });
    }

    // 6. Case-insensitive email check
    const normalizedEmail = email.toLowerCase().trim();
    const userExists = await User.findOne({ email: normalizedEmail });

    if (userExists) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        message: "Email already registered",
      });
    }

    // 7. Profile image upload to Cloudinary (or default avatar)
    let profileImageUrl = "";
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "smartkrishi",
        });
        profileImageUrl = result.secure_url;
        fs.unlinkSync(req.file.path);
      } catch (uploadError) {
        console.error("[CLOUDINARY REGISTRATION ERROR] Image upload failed:", uploadError.stack || uploadError);
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(500).json({
          message: "Failed to upload profile photo to Cloudinary: " + uploadError.message,
        });
      }
    } else {
      const initials = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase();
      profileImageUrl = `https://placehold.co/150x150/16a34a/ffffff?text=${initials || "User"}`;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    console.log(`[OTP GENERATION] Register request received for: ${normalizedEmail}`);
    console.log(`[OTP GENERATION] Generated OTP: ${otp}`);

    const user = new User({
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim(),
      email: normalizedEmail,
      phone: String(phone).trim(),
      password: hashedPassword,
      profileImage: profileImageUrl,
      role: userType === "SELLER" ? "seller" : "farmer",
      roles: [userType],
      otpCode: otp,
      otpExpiry: otpExpiry,
      emailVerified: false,
    });

    await user.save();
    console.log(`[DATABASE] User and OTP saved successfully for ${normalizedEmail}`);

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: normalizedEmail,
      subject: "Smart Krishi - Verification Code",
      html: `<h2>Welcome to Smart Krishi!</h2>
             <p>Thank you for registering with us. To activate your account, please verify your email address using the following 6-digit OTP:</p>
             <h3 style="background-color:#f4f4f4;padding:12px;display:inline-block;letter-spacing:5px;font-size:24px;border-radius:5px;color:#16a34a;">${otp}</h3>
             <p>This code is valid for <strong>10 minutes</strong>. If you did not request this code, please ignore this email.</p>
             <br/><p>Grow Smart, Live Better!</p><p>Smart Krishi Team</p>`
    };

    console.log(`[SMTP] Sending OTP email to recipient: ${normalizedEmail}`);
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`[SMTP] Email sent successfully. MessageID: ${info.messageId}`);

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
        message: "OTP Sent Successfully"
      });
    } catch (mailError) {
      console.error(`[SMTP] Failed to send email to ${normalizedEmail}. Error Stack:`, mailError);
      
      // Rollback database record
      await User.deleteOne({ _id: user._id });
      console.log(`[DATABASE] Rolled back user registration for ${normalizedEmail} due to email delivery failure`);

      return res.status(500).json({
        message: "Email delivery failed. SMTP Error: " + mailError.message,
      });
    }
  } catch (error) {
    console.error("[REGISTRATION ERROR] Error during user registration:", error.stack || error);
    // Cleanup files if left over
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      message: "Internal server error occurred: " + error.message,
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(400).json({
        message: "Invalid Email or Password",
      });
    }

    // Require verification
    if (!user.emailVerified) {
      return res.status(400).json({
        message: "Account is inactive. Please verify your email first.",
      });
    }

    if (await bcrypt.compare(password, user.password)) {
      const token = generateToken(user._id);
      res.json({
        accessToken: token,
        token: token,
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          name: user.name,
          email: user.email,
          phone: user.phone,
          profileImage: user.profileImage,
          roles: user.roles || [user.role || "BUYER"],
        }
      });
    } else {
      res.status(401).json({
        message: "Invalid Email or Password",
      });
    }
  } catch (error) {
    console.error("[LOGIN ERROR] Error during user login:", error.stack || error);
    res.status(500).json({
      message: "Internal server error occurred: " + error.message,
    });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otpCode } = req.body;

    if (!email || !otpCode) {
      return res.status(400).json({ message: "Email and OTP code are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

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

    console.log(`[OTP VERIFICATION] Email verified successfully for: ${normalizedEmail}`);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
      message: "Email verified and account activated successfully"
    });
  } catch (error) {
    console.error("[OTP VERIFICATION ERROR] Error during verification:", error.stack || error);
    res.status(500).json({ message: "Internal server error occurred: " + error.message });
  }
};

const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

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

    console.log(`[OTP RESEND] Generated new OTP: ${otp} for ${normalizedEmail}`);

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: normalizedEmail,
      subject: "Smart Krishi - Verification Code",
      html: `<h2>Welcome to Smart Krishi!</h2>
             <p>Here is your new OTP verification code:</p>
             <h3 style="background-color:#f4f4f4;padding:12px;display:inline-block;letter-spacing:5px;font-size:24px;border-radius:5px;color:#16a34a;">${otp}</h3>
             <p>This code is valid for <strong>10 minutes</strong>.</p>`
    };

    console.log(`[SMTP] Resending OTP email to recipient: ${normalizedEmail}`);
    try {
      await transporter.sendMail(mailOptions);
      console.log(`[SMTP] Resent OTP successfully to ${normalizedEmail}`);
      res.json({ message: "OTP Sent Successfully" });
    } catch (mailError) {
      console.error(`[SMTP] Resend failed for ${normalizedEmail}. Error Stack:`, mailError);
      res.status(500).json({
        message: "Email delivery failed. SMTP Error: " + mailError.message,
      });
    }
  } catch (error) {
    console.error("[OTP RESEND ERROR] Error during OTP resend:", error.stack || error);
    res.status(500).json({ message: "Internal server error occurred: " + error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  verifyOtp,
  resendOtp,
};