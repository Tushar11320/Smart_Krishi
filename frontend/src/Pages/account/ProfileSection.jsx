import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { User, Shield, CheckCircle, AlertCircle, Upload, Eye, Lock } from "lucide-react";

export default function ProfileSection() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Profile Form Fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileImage, setProfileImage] = useState("");

  // Change Password Fields
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passLoading, setPassLoading] = useState(false);
  const [passSuccess, setPassSuccess] = useState("");
  const [passError, setPassError] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      setFirstName(parsed.firstName || "");
      setLastName(parsed.lastName || "");
      setPhone(parsed.phone || "");
      setProfileImage(parsed.profileImage || "");
    }
  }, []);

  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setErrorMessage("");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post("/images/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const fileUrl = response.data?.data?.secureUrl || response.data?.secureUrl || response.data?.data || response.data;
      setProfileImage(fileUrl);
      setSuccessMessage("Profile photo uploaded successfully! Save changes to apply.");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to upload profile photo to Cloudinary.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await api.put("/users/profile", {
        firstName,
        lastName,
        phone: String(phone).trim(),
        profileImage
      });

      const updatedUser = response.data?.data || response.data;
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setIsEditing(false);
      setSuccessMessage("Profile updated successfully! 🌾");
      setTimeout(() => setSuccessMessage(""), 3000);

      // Fire a storage event to alert other components like Topbar/Navbar
      window.dispatchEvent(new Event("storage"));
    } catch (err) {
      console.error(err);
      setErrorMessage(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPassLoading(true);
    setPassError("");
    setPassSuccess("");

    if (newPassword !== confirmPassword) {
      setPassError("New passwords do not match.");
      setPassLoading(false);
      return;
    }

    try {
      await api.put("/users/change-password", {
        currentPassword,
        newPassword,
        confirmPassword
      });

      setPassSuccess("Password updated successfully! 🔒");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setPassSuccess("");
        setShowPasswordForm(false);
      }, 3000);
    } catch (err) {
      console.error(err);
      setPassError(err.response?.data?.message || "Failed to update password. Verify current password.");
    } finally {
      setPassLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-gray-150 shadow">
        <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500 font-medium">Synchronizing profile intelligence...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-8 border border-green-100 shadow-lg space-y-8 animate-fadeIn">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-gray-50 gap-4">
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-green-600 text-white rounded-full flex items-center justify-center text-3xl font-black shadow-md shadow-green-100 relative overflow-hidden group">
              {profileImage ? (
                <img src={profileImage} alt="" className="w-full h-full object-cover" />
              ) : (
                user.firstName[0] + user.lastName[0]
              )}
              
              {isEditing && (
                <label className="absolute inset-0 bg-black/55 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer text-white text-[10px] font-bold">
                  <Upload size={14} className="mb-0.5" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleProfileImageUpload} />
                </label>
              )}
            </div>
            {isEditing && (
              <div className="flex gap-1.5 mt-2">
                <label className="bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer transition flex items-center gap-0.5 shadow-sm">
                  Upload
                  <input type="file" accept="image/*" className="hidden" onChange={handleProfileImageUpload} />
                </label>
                {profileImage && (
                  <button
                    type="button"
                    onClick={() => setProfileImage("")}
                    className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition cursor-pointer border-0 outline-none"
                  >
                    Remove
                  </button>
                )}
              </div>
            )}
          </div>
          <div>
            <h2 className="text-3xl font-black text-green-950">{user.firstName} {user.lastName}</h2>
            <div className="flex gap-2 mt-2">
              {user.roles && user.roles.map(role => (
                <span key={role} className="bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full text-xs font-black uppercase">
                  {role.replace("ROLE_", "")}
                </span>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="bg-green-50 hover:bg-green-100 text-green-700 font-extrabold px-6 py-2.5 rounded-xl border border-green-200 transition"
        >
          {isEditing ? "Cancel" : "Edit Profile"}
        </button>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl flex items-center gap-3 font-medium text-sm">
          <CheckCircle className="text-green-600" size={20} />
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-center gap-3 font-medium text-sm">
          <AlertCircle className="text-red-600" size={20} />
          {errorMessage}
        </div>
      )}

      {/* Main Profile Info Form / View */}
      {isEditing ? (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-5">
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-500 mb-1 pl-1">First Name *</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="border border-gray-300 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Last Name *</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="border border-gray-300 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Phone Number *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="border border-gray-300 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Profile Photo (Optional)</label>
              <input
                type="text"
                value={profileImage}
                onChange={(e) => setProfileImage(e.target.value)}
                placeholder="Image URL or upload via avatar hover"
                className="border border-gray-300 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold px-6 py-3 rounded-xl transition"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-bold px-8 py-3 rounded-xl shadow transition"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      ) : (
        <div className="grid md:grid-cols-2 gap-6 text-sm">
          <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
            <span className="text-gray-400 font-bold uppercase text-xs">Email Address</span>
            <p className="font-extrabold text-gray-800 mt-1 text-base">{user.email}</p>
          </div>
          <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
            <span className="text-gray-400 font-bold uppercase text-xs">Phone Number</span>
            <p className="font-extrabold text-gray-800 mt-1 text-base">{user.phone}</p>
          </div>
          <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
            <span className="text-gray-400 font-bold uppercase text-xs">Account Status</span>
            <p className="font-extrabold text-green-700 mt-1 text-base uppercase">{user.userStatus || "ACTIVE"}</p>
          </div>
          <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
            <span className="text-gray-400 font-bold uppercase text-xs">Profile Verified</span>
            <p className="font-extrabold text-gray-800 mt-1 text-base">{user.emailVerified ? "Yes" : "No"}</p>
          </div>
        </div>
      )}

      {/* Change Password Segment */}
      <div className="border-t border-gray-100 pt-6">
        <button
          onClick={() => setShowPasswordForm(!showPasswordForm)}
          className="flex items-center gap-2 text-sm font-extrabold text-emerald-800 hover:underline cursor-pointer"
        >
          <Lock size={16} />
          {showPasswordForm ? "Hide Password Form" : "Update Account Password"}
        </button>

        {showPasswordForm && (
          <form onSubmit={handlePasswordChange} className="mt-6 space-y-4 max-w-md bg-gray-50/50 p-6 rounded-2xl border border-gray-100 animate-slideDown">
            <h3 className="font-bold text-gray-700 text-sm mb-2">Change Password</h3>

            {passSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded-xl text-xs font-bold">
                {passSuccess}
              </div>
            )}

            {passError && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-xs font-bold">
                {passError}
              </div>
            )}

            <div className="flex flex-col">
              <label className="text-xs font-semibold text-gray-500 mb-1">Current Password *</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-xs bg-white"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-semibold text-gray-500 mb-1">New Password *</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-xs bg-white"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-semibold text-gray-500 mb-1">Confirm New Password *</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-xs bg-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPasswordForm(false)}
                className="bg-white hover:bg-gray-100 border border-gray-250 text-gray-600 font-bold px-4 py-2 rounded-xl text-xs transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={passLoading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-bold px-5 py-2 rounded-xl text-xs shadow transition"
              >
                {passLoading ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
