import React from "react";
import {
  Wrench,
  CloudSun,
  Wheat,
  Tractor,
  Droplets,
  PhoneCall,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const helperServices = [
  {
    id: 1,
    title: "Machinery Help",
    description:
      "Get support for tractors, harvesters and farming machines.",
    icon: <Tractor size={40} />,
    color: "from-yellow-400 to-orange-500",
  },

  {
    id: 2,
    title: "Weather Assistance",
    description:
      "Daily weather updates and farming alerts for your crops.",
    icon: <CloudSun size={40} />,
    color: "from-blue-400 to-cyan-500",
  },

  {
    id: 3,
    title: "Crop Guidance",
    description:
      "Smart crop recommendations and farming solutions.",
    icon: <Wheat size={40} />,
    color: "from-green-400 to-green-600",
  },

  {
    id: 4,
    title: "Water Supply",
    description:
      "Quick irrigation and water support for agriculture.",
    icon: <Droplets size={40} />,
    color: "from-cyan-400 to-blue-600",
  },

  {
    id: 5,
    title: "Technical Support",
    description:
      "24/7 customer support for Smart Krishi platform users.",
    icon: <PhoneCall size={40} />,
    color: "from-pink-400 to-rose-500",
  },

  {
    id: 6,
    title: "Secure Services",
    description:
      "Trusted and secure farming marketplace solutions.",
    icon: <ShieldCheck size={40} />,
    color: "from-purple-400 to-purple-600",
  },
];

export default function Helpers() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-yellow-50">

      {/* Hero Section */}
      <div className="relative h-[65vh] overflow-hidden">

        <img
          src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854"
          alt="Helpers"
          className="absolute w-full h-full object-cover"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/60"></div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center h-full text-center text-white px-6">

          <div className="bg-white/10 backdrop-blur-lg px-6 py-3 rounded-full border border-white/20 mb-6 flex items-center gap-3">

            <Sparkles size={24} className="text-yellow-300" />

            <span className="font-semibold text-lg">
              Smart Krishi Helpers
            </span>

          </div>

          <h1 className="text-6xl md:text-7xl font-black leading-tight">

            Smart Farming <br />
            Help Center

          </h1>

          <p className="max-w-3xl mt-6 text-lg text-gray-200 leading-8">

            Explore smart agriculture support services,
            farming guidance and premium assistance tools.

          </p>

          <button className="mt-10 bg-green-600 hover:bg-green-700 text-white px-10 py-5 rounded-2xl text-xl font-bold shadow-2xl flex items-center gap-3 transition">

            Explore Support

            <ArrowRight size={24} />

          </button>
        </div>
      </div>

      {/* Services */}
      <section className="max-w-7xl mx-auto px-8 py-24">

        <div className="text-center mb-16">

          <h2 className="text-5xl font-black text-green-900">
            Premium Helper Services
          </h2>

          <p className="text-gray-600 mt-5 text-lg">
            Smart tools and services for modern agriculture.
          </p>

        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-10">

          {helperServices.map((service) => (

            <div
              key={service.id}
              className="group bg-white rounded-[35px] p-10 shadow-2xl hover:-translate-y-4 transition duration-500 overflow-hidden relative"
            >

              {/* Glow Effect */}
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-r ${service.color} transition duration-500`}></div>

              {/* Icon */}
              <div className={`w-24 h-24 rounded-3xl bg-gradient-to-r ${service.color} text-white flex items-center justify-center shadow-2xl`}>

                {service.icon}

              </div>

              {/* Title */}
              <h3 className="text-3xl font-black mt-8">
                {service.title}
              </h3>

              {/* Description */}
              <p className="text-gray-500 mt-5 leading-8 text-lg">

                {service.description}

              </p>

              {/* Button */}
              <button className="mt-8 flex items-center gap-3 text-green-700 font-bold text-lg group-hover:gap-5 transition-all">

                Learn More

                <ArrowRight size={22} />

              </button>
            </div>

          ))}
        </div>
      </section>

      {/* Feature Banner */}
      <section className="max-w-7xl mx-auto px-8 pb-24">

        <div className="bg-gradient-to-r from-green-700 to-green-900 rounded-[40px] overflow-hidden shadow-2xl grid md:grid-cols-2">

          {/* Left */}
          <div className="p-14 text-white flex flex-col justify-center">

            <div className="bg-white/10 backdrop-blur-lg w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl">

              <Wrench size={50} className="text-yellow-400" />

            </div>

            <h2 className="text-5xl font-black mt-10 leading-tight">

              Need Smart <br />
              Farming Help?

            </h2>

            <p className="text-green-100 text-lg mt-8 leading-9">

              Smart Krishi provides premium farming support,
              agriculture guidance and technical assistance
              for every farmer.

            </p>

            <button className="mt-10 bg-yellow-500 hover:bg-yellow-600 text-black px-10 py-5 rounded-2xl text-xl font-bold shadow-2xl transition w-fit">

              Contact Support

            </button>
          </div>

          {/* Right */}
          <div className="relative h-[500px]">

            <img
              src="https://images.unsplash.com/photo-1464226184884-fa280b87c399"
              alt="Support"
              className="w-full h-full object-cover"
            />

          </div>
        </div>
      </section>
    </div>
  );
}