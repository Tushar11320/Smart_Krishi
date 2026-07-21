const User = require("../models/User");

const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      res.json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        roles: user.roles || [user.role || "BUYER"],
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("[USER PROFILE GET ERROR] Error:", error.stack || error);
    res.status(500).json({ message: "Server error occurred while fetching profile" });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.firstName = req.body.firstName || user.firstName;
      user.lastName = req.body.lastName || user.lastName;
      user.name = `${user.firstName} ${user.lastName}`.trim();
      user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;
      user.profileImage = req.body.profileImage !== undefined ? req.body.profileImage : user.profileImage;

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        profileImage: updatedUser.profileImage,
        roles: updatedUser.roles || [updatedUser.role || "BUYER"],
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("[USER PROFILE UPDATE ERROR] Error:", error.stack || error);
    res.status(500).json({ message: "Server error occurred while updating profile" });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
};
