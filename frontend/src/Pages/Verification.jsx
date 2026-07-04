import React, { useState } from "react";
import {
  ShieldCheck,
  User,
  Phone,
  Mail,
  MapPin,
  Upload,
  CheckCircle,
  BadgeCheck,
} from "lucide-react";

export default function Verification() {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    aadhaar: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    alert("Verification Submitted Successfully 🚜");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-yellow-50">

      {/* Hero Section */}
      <div className="relative h-[60vh] overflow-hidden">

        <img
          src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854"
          alt="Verification"
          className="absolute w-full h-full object-cover"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/60"></div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center h-full text-center text-white px-6">

          <div className="bg-white/10 backdrop-blur-lg px-6 py-3 rounded-full border border-white/20 mb-6 flex items-center gap-3">

            <ShieldCheck size={28} className="text-green-300" />

            <span className="font-semibold text-lg">
              Secure Farmer Verification
            </span>

          </div>

          <h1 className="text-6xl md:text-7xl font-black leading-tight">

            Account <br />
            Verification

          </h1>

          <p className="max-w-3xl mt-6 text-lg text-gray-200 leading-8">

            Verify your Smart Krishi account to access
            secure marketplace services and premium features.

          </p>
        </div>
      </div>

      {/* Main Section */}
      <div className="max-w-7xl mx-auto px-8 py-20 grid lg:grid-cols-2 gap-14">

        {/* Left Side */}
        <div className="bg-white rounded-[35px] shadow-2xl p-10">

          <h2 className="text-4xl font-black text-green-900 mb-8">
            Verification Form
          </h2>

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >

            {/* Full Name */}
            <div className="bg-gray-100 rounded-2xl flex items-center px-5 py-4">

              <User size={24} className="text-gray-500" />

              <input
                type="text"
                name="fullName"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={handleChange}
                className="bg-transparent w-full ml-4 outline-none text-lg"
                required
              />

            </div>

            {/* Phone */}
            <div className="bg-gray-100 rounded-2xl flex items-center px-5 py-4">

              <Phone size={24} className="text-gray-500" />

              <input
                type="text"
                name="phone"
                placeholder="Mobile Number"
                value={formData.phone}
                onChange={handleChange}
                className="bg-transparent w-full ml-4 outline-none text-lg"
                required
              />

            </div>

            {/* Email */}
            <div className="bg-gray-100 rounded-2xl flex items-center px-5 py-4">

              <Mail size={24} className="text-gray-500" />

              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                className="bg-transparent w-full ml-4 outline-none text-lg"
                required
              />

            </div>

            {/* Address */}
            <div className="bg-gray-100 rounded-2xl flex items-center px-5 py-4">

              <MapPin size={24} className="text-gray-500" />

              <input
                type="text"
                name="address"
                placeholder="Village / Address"
                value={formData.address}
                onChange={handleChange}
                className="bg-transparent w-full ml-4 outline-none text-lg"
                required
              />

            </div>

            {/* Aadhaar */}
            <div className="bg-gray-100 rounded-2xl flex items-center px-5 py-4">

              <BadgeCheck size={24} className="text-gray-500" />

              <input
                type="text"
                name="aadhaar"
                placeholder="Aadhaar Number"
                value={formData.aadhaar}
                onChange={handleChange}
                className="bg-transparent w-full ml-4 outline-none text-lg"
                required
              />

            </div>

            {/* Upload */}
            <div className="border-2 border-dashed border-green-300 rounded-3xl p-8 text-center hover:bg-green-50 transition cursor-pointer">

              <Upload
                size={50}
                className="mx-auto text-green-600"
              />

              <h3 className="text-2xl font-bold mt-5">
                Upload Documents
              </h3>

              <p className="text-gray-500 mt-3">
                Aadhaar Card / Farmer ID / Land Proof
              </p>

              <input
                type="file"
                className="mt-6"
              />
            </div>

            {/* Button */}
            <button className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-5 rounded-2xl text-xl font-bold shadow-2xl transition">

              Submit Verification

            </button>

          </form>
        </div>

        {/* Right Side */}
        <div className="space-y-10">

          {/* Benefits */}
          <div className="bg-white rounded-[35px] shadow-2xl p-10">

            <h2 className="text-4xl font-black text-green-900 mb-8">
              Verification Benefits
            </h2>

            <div className="space-y-6">

              <div className="flex items-center gap-4">

                <CheckCircle
                  size={30}
                  className="text-green-600"
                />

                <p className="text-lg">
                  Trusted Marketplace Access
                </p>

              </div>

              <div className="flex items-center gap-4">

                <CheckCircle
                  size={30}
                  className="text-green-600"
                />

                <p className="text-lg">
                  Secure Payments & Orders
                </p>

              </div>

              <div className="flex items-center gap-4">

                <CheckCircle
                  size={30}
                  className="text-green-600"
                />

                <p className="text-lg">
                  Verified Farmer Badge
                </p>

              </div>

              <div className="flex items-center gap-4">

                <CheckCircle
                  size={30}
                  className="text-green-600"
                />

                <p className="text-lg">
                  Premium Features Access
                </p>

              </div>

            </div>
          </div>

          {/* Security Card */}
          <div className="bg-green-900 text-white rounded-[35px] p-10 shadow-2xl">

            <ShieldCheck
              size={70}
              className="text-yellow-400"
            />

            <h2 className="text-4xl font-black mt-8">
              100% Secure Verification
            </h2>

            <p className="text-green-100 text-lg mt-6 leading-8">

              Smart Krishi keeps your information safe
              and secure using trusted verification systems
              for farmers and agriculture businesses.

            </p>

            <button className="mt-8 bg-yellow-500 hover:bg-yellow-600 text-black px-8 py-4 rounded-2xl text-lg font-bold shadow-xl transition">

              Learn More

            </button>
          </div>
        </div>
      </div>
    </div>
  );
}