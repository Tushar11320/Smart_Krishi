import React from "react";
import {
  CloudSun,
  CloudRain,
  Wind,
  Thermometer,
  Droplets,
  Sun,
  MapPin,
  ArrowRight,
  Activity,
} from "lucide-react";

const weatherCards = [
  {
    id: 1,
    title: "Temperature",
    value: "28°C",
    icon: <Thermometer size={42} />,
    color: "from-orange-400 to-red-500",
  },

  {
    id: 2,
    title: "Humidity",
    value: "70%",
    icon: <Droplets size={42} />,
    color: "from-cyan-400 to-blue-600",
  },

  {
    id: 3,
    title: "Wind Speed",
    value: "12 km/h",
    icon: <Wind size={42} />,
    color: "from-green-400 to-green-600",
  },

  {
    id: 4,
    title: "Rain Chance",
    value: "65%",
    icon: <CloudRain size={42} />,
    color: "from-blue-400 to-indigo-600",
  },
];

const forecast = [
  {
    day: "Monday",
    weather: "Sunny",
    temp: "31°C",
    icon: <Sun size={36} className="text-yellow-400" />,
  },

  {
    day: "Tuesday",
    weather: "Cloudy",
    temp: "29°C",
    icon: <CloudSun size={36} className="text-cyan-400" />,
  },

  {
    day: "Wednesday",
    weather: "Rainy",
    temp: "25°C",
    icon: <CloudRain size={36} className="text-blue-500" />,
  },

  {
    day: "Thursday",
    weather: "Windy",
    temp: "27°C",
    icon: <Wind size={36} className="text-green-500" />,
  },
];

export default function WeatherUtils() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-green-50">

      {/* Hero Section */}
      <div className="relative h-[65vh] overflow-hidden">

        <img
          src="https://images.unsplash.com/photo-1506744038136-46273834b3fb"
          alt="Weather"
          className="absolute w-full h-full object-cover"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/60"></div>

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col justify-center items-center h-full text-center text-white px-6">

          <div className="bg-white/10 backdrop-blur-lg px-6 py-3 rounded-full border border-white/20 mb-6 flex items-center gap-3">

            <CloudSun size={28} className="text-cyan-300" />

            <span className="font-semibold text-lg">
              Smart Weather Monitoring
            </span>

          </div>

          <h1 className="text-6xl md:text-7xl font-black leading-tight">

            Smart Krishi <br />
            Weather Center

          </h1>

          <p className="max-w-3xl mt-6 text-lg text-gray-200 leading-8">

            Get live weather updates, rainfall alerts,
            humidity tracking and farming forecasts
            for smart agriculture planning.

          </p>

          <button className="mt-10 bg-cyan-500 hover:bg-cyan-600 text-white px-10 py-5 rounded-2xl text-xl font-bold shadow-2xl flex items-center gap-3 transition">

            Check Forecast

            <ArrowRight size={24} />

          </button>
        </div>
      </div>

      {/* Weather Stats */}
      <section className="max-w-7xl mx-auto px-8 py-24">

        <div className="grid md:grid-cols-4 gap-8">

          {weatherCards.map((card) => (

            <div
              key={card.id}
              className="group bg-white rounded-[35px] shadow-2xl p-8 hover:-translate-y-4 transition duration-500 relative overflow-hidden"
            >

              {/* Glow */}
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-r ${card.color} transition duration-500`}></div>

              {/* Icon */}
              <div className={`w-24 h-24 rounded-3xl bg-gradient-to-r ${card.color} text-white flex items-center justify-center shadow-2xl`}>

                {card.icon}

              </div>

              {/* Content */}
              <h3 className="text-3xl font-black mt-8">
                {card.title}
              </h3>

              <h2 className="text-5xl font-black text-cyan-700 mt-6">
                {card.value}
              </h2>

              <button className="mt-8 flex items-center gap-3 text-cyan-700 font-bold text-lg group-hover:gap-5 transition-all">

                View Details

                <ArrowRight size={22} />

              </button>
            </div>

          ))}
        </div>
      </section>

      {/* Forecast */}
      <section className="max-w-7xl mx-auto px-8 pb-24">

        <div className="text-center mb-16">

          <h2 className="text-5xl font-black text-cyan-900">
            Weekly Forecast
          </h2>

          <p className="text-gray-600 mt-5 text-lg">
            Smart weather prediction for farmers.
          </p>

        </div>

        <div className="grid md:grid-cols-4 gap-8">

          {forecast.map((item, index) => (

            <div
              key={index}
              className="bg-white rounded-[35px] shadow-2xl p-10 text-center hover:-translate-y-4 transition duration-500"
            >

              <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-xl">

                {item.icon}

              </div>

              <h3 className="text-3xl font-black mt-8">
                {item.day}
              </h3>

              <p className="text-gray-500 text-lg mt-3">
                {item.weather}
              </p>

              <h2 className="text-5xl font-black text-cyan-700 mt-6">
                {item.temp}
              </h2>

            </div>

          ))}
        </div>
      </section>

      {/* Smart Banner */}
      <section className="max-w-7xl mx-auto px-8 pb-24">

        <div className="bg-gradient-to-r from-cyan-700 to-blue-900 rounded-[40px] overflow-hidden shadow-2xl grid md:grid-cols-2">

          {/* Left */}
          <div className="p-14 text-white flex flex-col justify-center">

            <div className="bg-white/10 backdrop-blur-lg w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl">

              <Activity size={50} className="text-yellow-400" />

            </div>

            <h2 className="text-5xl font-black mt-10 leading-tight">

              AI Weather <br />
              Forecasting

            </h2>

            <p className="text-cyan-100 text-lg mt-8 leading-9">

              Smart Krishi provides live weather alerts,
              rain predictions and farming climate updates
              for better crop planning.

            </p>

            <div className="flex items-center gap-3 mt-8 text-xl">

              <MapPin size={28} />

              <span>
                Live Updates Across India
              </span>

            </div>

            <button className="mt-10 bg-yellow-500 hover:bg-yellow-600 text-black px-10 py-5 rounded-2xl text-xl font-bold shadow-2xl transition w-fit">

              Explore Forecast

            </button>
          </div>

          {/* Right */}
          <div className="relative h-[500px]">

            <img
              src="https://images.unsplash.com/photo-1494526585095-c41746248156"
              alt="Forecast"
              className="w-full h-full object-cover"
            />

          </div>
        </div>
      </section>
    </div>
  );
}