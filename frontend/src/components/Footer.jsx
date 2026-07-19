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
            <span>+91 9669115169</span>
          </div>

          <div className="flex items-center gap-3">
            <IoCall />
            <span>+91 6262782714</span>
          </div>
        </div>

        {/* Social Icons */}
        <div className="flex gap-5 text-2xl">
          <FaFacebook className="cursor-pointer hover:scale-110 transition" />
          <a href="https://www.instagram.com/smar.tkrishi?igsh=bjR0ZmZiY3d2YXdn" target="_blank" rel="noopener noreferrer">
            <FaInstagram className="cursor-pointer hover:scale-110 transition hover:text-emerald-200" />
          </a>
          <FaTwitter className="cursor-pointer hover:scale-110 transition" />
          <a href="https://www.linkedin.com/in/tushar-barskar-3b554a297?utm_source=share_via&utm_content=profile&utm_medium=member_android" target="_blank" rel="noopener noreferrer">
            <FaLinkedin className="cursor-pointer hover:scale-110 transition hover:text-emerald-200" />
          </a>
          <a href="https://youtube.com/@studentmotivation-p5k?si=gBTtsbaiH61GVwHf" target="_blank" rel="noopener noreferrer">
            <FaYoutube className="cursor-pointer hover:scale-110 transition hover:text-emerald-200" />
          </a>
        </div>

        <div className="border-t border-green-500 mt-6 pt-4 text-center">
          © 2026 Jay Kishan. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}