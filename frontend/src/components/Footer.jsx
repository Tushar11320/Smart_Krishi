import React from "react";
import {
  FaShoppingBag,
  FaFacebook,
  FaInstagram,
  FaTwitter,
  FaLinkedin,
  FaYoutube,
  FaLocationArrow,
  FaMobileAlt,
} from "react-icons/fa";
import { IoCall } from "react-icons/io5";

export default function Footer() {
  return (
    <footer className="bg-green-700 text-white py-10">
      <div className="container mx-auto px-6">

        {/* Logo */}
        <div className="flex items-center gap-2 mb-6">
          <FaShoppingBag size={28} />
          <h1 className="text-2xl font-bold">Jay Kishan</h1>
        </div>

        {/* Contact Info */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3">
            <FaLocationArrow />
            <span>Bhopal, Madhya Pradesh</span>
          </div>

          <div className="flex items-center gap-3">
            <FaMobileAlt />
            <span>+91 9669525146</span>
          </div>

          <div className="flex items-center gap-3">
            <IoCall />
            <span>+91 6262782714</span>
          </div>
        </div>

        {/* Social Icons */}
        <div className="flex gap-5 text-2xl">
          <FaFacebook className="cursor-pointer hover:scale-110 transition" />
          <FaInstagram className="cursor-pointer hover:scale-110 transition" />
          <FaTwitter className="cursor-pointer hover:scale-110 transition" />
          <FaLinkedin className="cursor-pointer hover:scale-110 transition" />
          <FaYoutube className="cursor-pointer hover:scale-110 transition" />
        </div>

        <div className="border-t border-green-500 mt-6 pt-4 text-center">
          © 2026 Jay Kishan. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}