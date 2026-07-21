const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    name: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    profileImage: {
      type: String,
      default: "",
    },

    role: {
      type: String,
      default: "farmer",
    },

    roles: {
      type: [String],
      default: ["BUYER"],
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    phoneVerified: {
      type: Boolean,
      default: false,
    },

    otpCode: {
      type: String,
    },

    otpExpiry: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to populate full name and roles
userSchema.pre("save", function (next) {
  if (this.firstName || this.lastName) {
    this.name = `${this.firstName || ""} ${this.lastName || ""}`.trim();
  }
  next();
});

module.exports = mongoose.model("User", userSchema);