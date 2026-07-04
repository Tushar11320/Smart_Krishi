import React from "react";
import {
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  Snowflake,
  CloudSun,
  Droplet
} from "lucide-react";

export default function ForecastCard({ forecast }) {
  if (!forecast) return null;

  // Weather Condition Icon selector
  const getWeatherIcon = (condition, size = 28) => {
    const cond = condition ? condition.toLowerCase() : "";
    if (cond.includes("clear")) {
      return <Sun size={size} className="text-amber-500 mx-auto" />;
    } else if (cond.includes("rain") || cond.includes("drizzle")) {
      return <CloudRain size={size} className="text-blue-500 mx-auto" />;
    } else if (cond.includes("thunderstorm")) {
      return <CloudLightning size={size} className="text-purple-600 mx-auto" />;
    } else if (cond.includes("snow")) {
      return <Snowflake size={size} className="text-sky-400 mx-auto" />;
    } else if (cond.includes("cloud")) {
      return <CloudSun size={size} className="text-slate-400 mx-auto" />;
    }
    return <Cloud size={size} className="text-gray-400 mx-auto" />;
  };

  return (
    <div className="bg-gradient-to-b from-white to-emerald-50/20 border border-emerald-100/20 hover:border-emerald-500/30 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 p-5 text-center flex flex-col justify-between gap-4 group">
      <div>
        <p className="font-bold text-emerald-950 text-sm tracking-wider uppercase">{forecast.dayOfWeek}</p>
        <p className="text-[10px] text-emerald-800/50 mt-0.5 font-semibold">
          {forecast.dateTime ? forecast.dateTime.substring(5, 10) : ""}
        </p>
      </div>

      <div className="py-2 transform group-hover:scale-110 transition-transform duration-300">
        {getWeatherIcon(forecast.weatherCondition, 36)}
      </div>

      <div>
        <p className="text-xl font-black text-emerald-900 font-outfit">
          {Math.round(forecast.temperature)}°C
        </p>
        <p className="text-xs text-emerald-800/70 font-semibold capitalize mt-1 truncate">
          {forecast.weatherDescription}
        </p>
      </div>

      {forecast.rainProbability > 0 ? (
        <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50/50 py-1.5 px-2 rounded-full border border-blue-100/30">
          <Droplet size={10} className="fill-blue-500" />
          <span>{Math.round(forecast.rainProbability)}% Rain</span>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-emerald-800/40 bg-emerald-50/20 py-1.5 px-2 rounded-full border border-emerald-100/10">
          <span>Dry</span>
        </div>
      )}
    </div>
  );
}
