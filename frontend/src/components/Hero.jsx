import React from "react";

export default function Hero() {
  return (
    <section className="relative w-full h-screen overflow-hidden">

      {/* Video Background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/videos/farm.mp4" type="video/mp4" />
      </video>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60"></div>

      {/* Animated Gradient */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-green-900/40 to-black/40"></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center text-white px-6 animate-fadeIn">

        <h1 className="text-5xl md:text-7xl font-extrabold leading-tight drop-shadow-lg">

          Smart Farming <br />

          <span className="text-yellow-300">
            Future of Agriculture
          </span>

        </h1>

        <p className="mt-6 max-w-2xl text-lg md:text-xl text-gray-200 leading-relaxed">

          Buy machinery, crops, lands, milk products,
          weather updates and smart farming tools
          all in one platform.

        </p>

        {/* Buttons */}
        <div className="mt-10 flex flex-wrap gap-5">

          <button className="bg-green-500 hover:bg-green-600 px-8 py-4 rounded-2xl text-lg font-semibold shadow-2xl hover:scale-105 transition duration-300">

            Explore Now

          </button>

          <button className="bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/30 px-8 py-4 rounded-2xl text-lg transition duration-300">

            Watch Demo

          </button>

        </div>

      </div>

    </section>
  );
}