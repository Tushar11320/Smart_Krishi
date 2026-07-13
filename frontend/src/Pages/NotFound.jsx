import React from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Home,
  ArrowLeft,
  Tractor,
} from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center px-6">

      {/* Main Card */}
      <div className="max-w-5xl w-full bg-white shadow-2xl rounded-[40px] overflow-hidden grid md:grid-cols-2">

        {/* Left Section */}
        <div className="relative bg-green-900 text-white flex flex-col justify-center items-center p-12 overflow-hidden">

          {/* Background Circle */}
          <div className="absolute w-96 h-96 bg-green-700 rounded-full opacity-20 -top-20 -left-20"></div>

          <div className="absolute w-80 h-80 bg-green-500 rounded-full opacity-10 bottom-0 right-0"></div>

          {/* Icon */}
          <div className="relative z-10 bg-white/10 backdrop-blur-lg p-8 rounded-full border border-white/20 shadow-2xl">

            <AlertTriangle size={90} className="text-yellow-400" />

          </div>

          {/* Text */}
          <h1 className="relative z-10 text-[120px] font-black mt-10 leading-none">
            404
          </h1>

          <h2 className="relative z-10 text-4xl font-bold mt-4 text-center">
            Page Not Found
          </h2>

          <p className="relative z-10 text-green-100 mt-6 text-lg text-center max-w-md leading-8">

            The page you are looking for does not exist
            or may have been moved.

          </p>
        </div>

        {/* Right Section */}
        <div className="flex flex-col justify-center p-12">

          {/* Logo */}
          <div className="flex items-center gap-4 mb-8">

            <div className="bg-green-100 p-4 rounded-2xl">

              <Tractor size={40} className="text-green-700" />

            </div>

            <div>

              <h2 className="text-4xl font-black text-green-900">
                Smart Krishi
              </h2>

              <p className="text-gray-500 mt-1">
                Future of Agriculture
              </p>

            </div>
          </div>

          {/* Message */}
          <h3 className="text-5xl font-black text-gray-900 leading-tight">
            Oops! <br />
            Something Went Wrong
          </h3>

          <p className="text-gray-600 text-lg mt-6 leading-8">

            It seems the page you're trying to visit
            is unavailable. Return to the homepage
            and continue exploring smart farming services.

          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-5 mt-10">

            <Link
              to="/"
              className="flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white px-8 py-5 rounded-2xl text-lg font-bold shadow-xl transition"
            >

              <Home size={24} />

              Go To Home

            </Link>

            <button
              onClick={() => window.history.back()}
              className="flex items-center justify-center gap-3 border-2 border-green-600 text-green-700 hover:bg-green-50 px-8 py-5 rounded-2xl text-lg font-bold transition"
            >

              <ArrowLeft size={24} />

              Go Back

            </button>
          </div>

          {/* Extra Info */}
          <div className="mt-12 bg-green-50 border border-green-100 rounded-3xl p-6">

            <h4 className="text-2xl font-bold text-green-900">
              Need Help?
            </h4>

            <p className="text-gray-600 mt-3 leading-7">

              Contact Smart Krishi support team for
              assistance with marketplace, weather,
              land selling or farming tools.

            </p>

            <button className="mt-5 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition">

              Contact Support
              Mobile: +91 6262782714
                       +91 9669115169
                       

            </button>
          </div>
        </div>
      </div>
    </div>
  );
}