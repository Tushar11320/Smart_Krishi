import React from "react";
import {
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  Snowflake,
  CloudSun,
  Thermometer,
  Droplets,
  Wind,
  Eye,
  Sunrise,
  Sunset,
  ShieldAlert,
  Wind as AirIcon
} from "lucide-react";

export default function WeatherCard({ weather }) {
  if (!weather) return null;

  // Format epoch timestamps to local time string
  const formatTime = (epochSeconds) => {
    if (!epochSeconds) return "--:--";
    const date = new Date(epochSeconds * 1000);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Weather Condition Icon selector
  const getWeatherIcon = (condition, size = 64) => {
    const cond = condition ? condition.toLowerCase() : "";
    if (cond.includes("clear")) {
      return <Sun size={size} className="text-amber-500 animate-spin-slow" />;
    } else if (cond.includes("rain") || cond.includes("drizzle")) {
      return <CloudRain size={size} className="text-blue-500 animate-bounce-slow" />;
    } else if (cond.includes("thunderstorm")) {
      return <CloudLightning size={size} className="text-purple-600 animate-pulse" />;
    } else if (cond.includes("snow")) {
      return <Snowflake size={size} className="text-sky-400" />;
    } else if (cond.includes("cloud")) {
      return <CloudSun size={size} className="text-slate-400" />;
    }
    return <Cloud size={size} className="text-gray-400" />;
  };

  // AQI color indicator and label
  const getAqiDetails = (aqi) => {
    switch (aqi) {
      case 1:
        return { label: "Good", color: "bg-emerald-500/20 text-emerald-700 border-emerald-500/30" };
      case 2:
        return { label: "Fair", color: "bg-green-500/20 text-green-700 border-green-500/30" };
      case 3:
        return { label: "Moderate", color: "bg-amber-500/20 text-amber-700 border-amber-500/30" };
      case 4:
        return { label: "Poor", color: "bg-orange-500/20 text-orange-700 border-orange-500/30" };
      case 5:
        return { label: "Very Poor", color: "bg-rose-500/20 text-rose-700 border-rose-500/30" };
      default:
        return { label: "Unknown", color: "bg-gray-500/20 text-gray-700 border-gray-500/30" };
    }
  };

  const aqiInfo = getAqiDetails(weather.airQualityIndex);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/90 to-white/70 border border-emerald-100/50 backdrop-blur-xl shadow-[0_20px_50px_rgba(16,185,129,0.05)] p-8">
      {/* Top section: City, Condition & Icon */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-emerald-50/50">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold font-outfit text-emerald-950">
              {weather.city}
            </h2>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${aqiInfo.color} flex items-center gap-1.5`}>
              <ShieldAlert size={12} />
              AQI: {aqiInfo.label}
            </span>
          </div>
          <p className="text-emerald-800/80 font-medium capitalize mt-1 text-sm">
            {weather.weatherDescription}
          </p>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-6xl font-black text-emerald-900 tracking-tight font-outfit">
              {Math.round(weather.temperature)}°C
            </span>
            <span className="text-emerald-700/60 font-semibold text-lg">
              (Feels like {Math.round(weather.feelsLike)}°C)
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100/30 shadow-inner">
          {getWeatherIcon(weather.weatherCondition, 72)}
        </div>
      </div>

      {/* Grid: Primary Weather Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6">
        <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-emerald-50/20 border border-emerald-100/10 hover:shadow-md transition-shadow">
          <div className="p-3 bg-red-500/10 text-red-600 rounded-xl">
            <Thermometer size={22} />
          </div>
          <div>
            <p className="text-xs text-emerald-800/60 font-semibold">Feels Like</p>
            <p className="text-base font-bold text-emerald-950 font-outfit">{Math.round(weather.feelsLike)}°C</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-emerald-50/20 border border-emerald-100/10 hover:shadow-md transition-shadow">
          <div className="p-3 bg-blue-500/10 text-blue-600 rounded-xl">
            <Droplets size={22} />
          </div>
          <div>
            <p className="text-xs text-emerald-800/60 font-semibold">Humidity</p>
            <p className="text-base font-bold text-emerald-950 font-outfit">{weather.humidity}%</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-emerald-50/20 border border-emerald-100/10 hover:shadow-md transition-shadow">
          <div className="p-3 bg-teal-500/10 text-teal-600 rounded-xl">
            <Wind size={22} />
          </div>
          <div>
            <p className="text-xs text-emerald-800/60 font-semibold">Wind Speed</p>
            <p className="text-base font-bold text-emerald-950 font-outfit">{weather.windSpeed} km/h</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-emerald-50/20 border border-emerald-100/10 hover:shadow-md transition-shadow">
          <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl">
            <Eye size={22} />
          </div>
          <div>
            <p className="text-xs text-emerald-800/60 font-semibold">Visibility</p>
            <p className="text-base font-bold text-emerald-950 font-outfit">
              {weather.visibility ? `${(weather.visibility / 1000).toFixed(1)} km` : "10 km"}
            </p>
          </div>
        </div>
      </div>

      {/* Footer block: Sunrise/Sunset */}
      <div className="flex justify-between items-center mt-6 pt-6 border-t border-emerald-50/50 text-xs font-semibold text-emerald-800/70">
        <div className="flex items-center gap-2 bg-amber-500/5 px-3 py-1.5 rounded-full border border-amber-500/10">
          <Sunrise size={14} className="text-amber-500" />
          <span>Sunrise: {formatTime(weather.sunrise)}</span>
        </div>
        <div className="flex items-center gap-2 bg-indigo-500/5 px-3 py-1.5 rounded-full border border-indigo-500/10">
          <Sunset size={14} className="text-indigo-500" />
          <span>Sunset: {formatTime(weather.sunset)}</span>
        </div>
      </div>
    </div>
  );
}
