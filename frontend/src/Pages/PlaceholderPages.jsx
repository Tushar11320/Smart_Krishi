import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import {
  CloudSun,
  ShieldAlert,
  TrendingUp,
  LineChart,
  MapPin,
  CreditCard,
  Settings,
  HelpCircle,
  Mail,
  FileQuestion,
  ChevronLeft,
  ArrowRight,
  Download,
  Phone,
  MessageSquare,
  Send,
  Search,
  ChevronDown,
  ChevronUp,
  Droplets,
  Sprout,
  Sun,
  CloudRain,
  Loader2
} from "lucide-react";
import { faqData } from "../assets/faqData";
import WeatherService from "../services/WeatherService";

// Helper layout component for placeholder pages
function PageWrapper({ title, icon: Icon, children }) {
  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn">
      <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
        <div className="p-3 bg-green-50 text-green-700 rounded-2xl">
          <Icon size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-green-950">{title}</h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">Smart Krishi Platform &bull; Live Intelligence</p>
        </div>
      </div>
      {children}
    </div>
  );
}

// 1. Weather Forecast
export function WeatherForecast() {
  const forecastDays = [
    { day: "Today", temp: "32°C / 24°C", cond: "Scattered Showers", humidity: "78%", precipitation: "60%" },
    { day: "Tomorrow", temp: "30°C / 23°C", cond: "Heavy Rain", humidity: "85%", precipitation: "90%" },
    { day: "Thursday", temp: "31°C / 24°C", cond: "Thunderstorms", humidity: "80%", precipitation: "75%" },
    { day: "Friday", temp: "33°C / 25°C", cond: "Partly Cloudy", humidity: "70%", precipitation: "20%" },
    { day: "Saturday", temp: "34°C / 26°C", cond: "Sunny", humidity: "65%", precipitation: "10%" },
  ];

  return (
    <PageWrapper title="Weather Forecast Intelligence" icon={CloudSun}>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-gray-800">5-Day Agricultural Outlook</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="text-gray-400 font-bold border-b border-gray-100 pb-3">
                  <th className="pb-3">Day</th>
                  <th className="pb-3">Temperature</th>
                  <th className="pb-3">Conditions</th>
                  <th className="pb-3">Humidity</th>
                  <th className="pb-3">Precipitation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-semibold text-gray-700">
                {forecastDays.map((f, i) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="py-4 font-bold text-green-950">{f.day}</td>
                    <td className="py-4 font-mono">{f.temp}</td>
                    <td className="py-4">{f.cond}</td>
                    <td className="py-4">{f.humidity}</td>
                    <td className="py-4 text-blue-600">{f.precipitation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-600 to-indigo-800 text-white rounded-3xl p-6 shadow-md flex flex-col justify-between">
          <div className="space-y-4">
            <span className="text-[10px] uppercase font-black tracking-wider bg-white/20 px-3 py-1 rounded-full">Sowing Alert</span>
            <h4 className="text-xl font-bold mt-2">Optimal Planting Window</h4>
            <p className="text-sm opacity-90 leading-relaxed">
              Based on rainfall projections, crops requiring medium soil moisture should be planted between Saturday and Monday. Avoid applying fertilizers before Friday due to heavy forecast precipitation.
            </p>
          </div>
          <Link to="/weather" className="mt-6 inline-flex items-center gap-1 text-xs font-black bg-white text-blue-700 px-4 py-2 rounded-xl w-fit shadow">
            Detailed Metrics <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </PageWrapper>
  );
}

export function FarmerAdvisories() {
  const [loading, setLoading] = useState(true);
  const [weatherData, setWeatherData] = useState(null);
  const [error, setError] = useState(null);

  const fetchByCity = async (city) => {
    try {
      const data = await WeatherService.getCurrentWeather(city);
      setWeatherData(data);
      setError(null);
    } catch (err) {
      console.error("Error loading weather data by city:", err);
      setError("Our real-time weather stations are currently offline. Please verify your connection or retry shortly.");
    } finally {
      setLoading(false);
    }
  };

  const loadAdvisories = async () => {
    setLoading(true);
    setError(null);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const data = await WeatherService.getWeatherByCoordinates(latitude, longitude);
            setWeatherData(data);
            setError(null);
            setLoading(false);
          } catch (err) {
            console.warn("Coords load failed, falling back to Bhopal:", err);
            await fetchByCity("Bhopal");
          }
        },
        async (geoErr) => {
          console.warn("Geolocation denied/failed, falling back to Bhopal:", geoErr);
          await fetchByCity("Bhopal");
        }
      );
    } else {
      await fetchByCity("Bhopal");
    }
  };

  useEffect(() => {
    loadAdvisories();
  }, []);

  const getAdvisoryIcon = (category) => {
    switch (category) {
      case "Irrigation Advice":
        return <Droplets className="text-blue-500" size={20} />;
      case "Fertilizer Advice":
        return <Sprout className="text-emerald-500" size={20} />;
      case "Pesticide Advice":
        return <ShieldAlert className="text-amber-500" size={20} />;
      case "Crop Warnings":
        return <ShieldAlert className="text-red-500" size={20} />;
      case "Heat Warnings":
        return <Sun className="text-orange-500" size={20} />;
      case "Heavy Rainfall Warnings":
        return <CloudRain className="text-indigo-500" size={20} />;
      default:
        return <ShieldAlert className="text-green-500" size={20} />;
    }
  };

  const getUrgencyClass = (urgency) => {
    switch (urgency) {
      case "CRITICAL":
        return "bg-red-50 text-red-600 border border-red-100";
      case "WARNING":
        return "bg-yellow-50 text-yellow-600 border border-yellow-100";
      case "NORMAL":
      default:
        return "bg-green-50 text-green-700 border border-green-100";
    }
  };

  const generateRealTimeAdvisories = (data) => {
    if (!data) return [];

    const temp = data.temperature;
    const humidity = data.humidity;
    const wind = data.windSpeed;
    const rainProb = data.rainProbability || 0;
    const condition = (data.weatherCondition || "").toLowerCase();
    const description = (data.weatherDescription || "").toLowerCase();
    const city = data.city || "your location";

    const list = [];

    // 1. Irrigation Advice
    let irrigationText = "";
    let irrigationUrgency = "NORMAL";
    if (rainProb > 60 || condition.includes("rain") || condition.includes("drizzle")) {
      irrigationText = "Suspension Alert: High precipitation probability detected. Suspend active irrigation schedules to prevent soil saturation, oxygen depletion in root zones, and nutrient leaching.";
      irrigationUrgency = "WARNING";
    } else if (temp > 35 && humidity < 40) {
      irrigationText = "Critical Water Replenishment: Elevated temperature and low humidity will accelerate evapotranspiration. Increase irrigation volume by 20% and irrigate exclusively during early morning or late evening.";
      irrigationUrgency = "CRITICAL";
    } else {
      irrigationText = "Optimal Irrigation: Ambient temperature and soil transpiration levels are balanced. Maintain default crop irrigation intervals.";
      irrigationUrgency = "NORMAL";
    }
    list.push({
      category: "Irrigation Advice",
      title: "Irrigation Scheduling",
      urgency: irrigationUrgency,
      note: irrigationText,
      detail: `Temperature: ${temp}°C, Humidity: ${humidity}%, Rain: ${rainProb}%`
    });

    // 2. Fertilizer Advice
    let fertilizerText = "";
    let fertilizerUrgency = "NORMAL";
    if (rainProb > 40 || condition.includes("rain")) {
      fertilizerText = "Fertilizer Delay Needed: Do not apply granular urea, NPK, or water-soluble fertilizers. Impending precipitation will wash away nutrients, causing nitrogen runoff and fertilizer waste.";
      fertilizerUrgency = "WARNING";
    } else if (wind > 15) {
      fertilizerText = "Application Hazard: Wind speeds exceed 15 km/h. Avoid foliar fertilizer spraying to prevent chemical drift and ensure uniform nutrient distribution.";
      fertilizerUrgency = "WARNING";
    } else {
      fertilizerText = "Ideal Fertilizer Window: Dry and calm conditions are highly favorable for fertilizer top-dressing. Ensure soil has moderate moisture for optimal root absorption.";
      fertilizerUrgency = "NORMAL";
    }
    list.push({
      category: "Fertilizer Advice",
      title: "Nutrient Application Advisory",
      urgency: fertilizerUrgency,
      note: fertilizerText,
      detail: `Wind: ${wind} km/h, Rain Probability: ${rainProb}%`
    });

    // 3. Pesticide Advice
    let pesticideText = "";
    let pesticideUrgency = "NORMAL";
    if (wind > 20) {
      pesticideText = "Spraying Restricted: Strong winds detected. Foliar pesticide spraying is highly prohibited as it causes severe chemical drift, wasting materials and endangering nearby fields.";
      pesticideUrgency = "CRITICAL";
    } else if (rainProb > 30) {
      pesticideText = "Rain Washout Threat: High probability of rain. Avoid spraying contact insecticides or fungicides as they will be washed off. Choose systemic alternatives or postpone spraying.";
      pesticideUrgency = "WARNING";
    } else if (temp > 35) {
      pesticideText = "Evaporative Loss Warning: Temperatures are above 35°C. Spraying during peak hours will cause rapid droplet evaporation. Spray only after sunset or at sunrise.";
      pesticideUrgency = "WARNING";
    } else {
      pesticideText = "Excellent Spraying Window: Wind speeds are under limits and skies are clear. Suitable for both contact and systemic pesticide applications.";
      pesticideUrgency = "NORMAL";
    }
    list.push({
      category: "Pesticide Advice",
      title: "Chemical Spray Protection",
      urgency: pesticideUrgency,
      note: pesticideText,
      detail: `Wind: ${wind} km/h, Temperature: ${temp}°C`
    });

    // 4. Crop Warnings
    let cropText = "";
    let cropUrgency = "NORMAL";
    if (humidity > 85) {
      cropText = "Fungal Outbreak Alert: Relative humidity exceeds 85%. Conditions are highly conducive for blast in rice, rust in wheat, and downy mildew in vegetables. Inspect crops daily and spray prophylactic bio-fungicides.";
      cropUrgency = "WARNING";
    } else if (wind > 25) {
      cropText = "Lodging and Staking Alert: High wind gusts present a threat of crop lodging. Provide immediate physical bamboo staking support to banana plants, sugarcane crops, and tall maize/sorghum plants.";
      cropUrgency = "WARNING";
    } else {
      cropText = "Low Biological Stress: Microclimate parameters are within safety limits. Crop disease vulnerability index is normal.";
      cropUrgency = "NORMAL";
    }
    list.push({
      category: "Crop Warnings",
      title: "Crop Stress & Disease Warning",
      urgency: cropUrgency,
      note: cropText,
      detail: `Humidity: ${humidity}%, Wind: ${wind} km/h`
    });

    // 5. Heat Warnings
    let heatText = "";
    let heatUrgency = "NORMAL";
    if (temp > 40) {
      heatText = "Extreme Heatwave Warning: Temperature exceeds 40°C. High danger of crop sunburn, flower drop, and physiological wilting. Limit outdoor human labor between 12 PM - 4 PM. Apply light straw mulch.";
      heatUrgency = "CRITICAL";
    } else if (temp > 35) {
      heatText = "Moderate Heat Stress: Crop heat stress index is elevated. Maintain high moisture levels in nurseries and protect young seedlings using green shade nets.";
      heatUrgency = "WARNING";
    } else if (temp < 12) {
      heatText = "Frost/Cold Warning: Temperatures are low. Cover high-value horticultural crops with plastic sheets or perform light nocturnal smoking/irrigation to keep soil warm.";
      heatUrgency = "WARNING";
    } else {
      heatText = "Temperature Safety: Ambient temperature is optimal for crop metabolism, photosynthesis, and vegetative development.";
      heatUrgency = "NORMAL";
    }
    list.push({
      category: "Heat Warnings",
      title: "Thermal Stress Advisory",
      urgency: heatUrgency,
      note: heatText,
      detail: `Temperature: ${temp}°C`
    });

    // 6. Heavy Rainfall Warnings
    let rainText = "";
    let rainUrgency = "NORMAL";
    if (rainProb > 70 || condition.includes("heavy") || condition.includes("thunderstorm") || description.includes("heavy")) {
      rainText = "Severe Downpour Alert: Heavy rainfall predicted. High risk of field flooding and waterlogging. Clean and clear all primary drainage channels immediately to allow rapid excess water run-off.";
      rainUrgency = "CRITICAL";
    } else if (rainProb > 40) {
      rainText = "Moderate Rainfall Advisory: Moderate rain is expected. Good for rainfed crops, but ensure drainage paths are unobstructed to prevent water pockets.";
      rainUrgency = "WARNING";
    } else {
      rainText = "No Heavy Rainfall Expected: Precipitation is not expected to interfere with harvest or sowing activities over the next 24 hours.";
      rainUrgency = "NORMAL";
    }
    list.push({
      category: "Heavy Rainfall Warnings",
      title: "Precipitation Warning",
      urgency: rainUrgency,
      note: rainText,
      detail: `Rain: ${rainProb}%, Condition: ${data.weatherDescription}`
    });

    return list;
  };

  const advisoriesList = generateRealTimeAdvisories(weatherData);

  if (loading) {
    return (
      <PageWrapper title="Agronomic Advisories" icon={ShieldAlert}>
        <div className="bg-white rounded-[32px] p-24 border border-gray-100 shadow-sm flex flex-col items-center justify-center space-y-4 font-outfit">
          <Loader2 className="text-green-600 animate-spin" size={48} />
          <div className="text-center">
            <h4 className="text-lg font-bold text-gray-700">Analysing Farm Microclimate...</h4>
            <p className="text-sm text-gray-400 mt-1">Retrieving sensor logs and computing real-time agronomic recommendations...</p>
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (error || !weatherData) {
    return (
      <PageWrapper title="Agronomic Advisories" icon={ShieldAlert}>
        <div className="bg-white rounded-[32px] p-12 border border-red-100 shadow-sm flex flex-col items-center justify-center space-y-6 text-center max-w-2xl mx-auto my-12 font-outfit">
          <ShieldAlert className="text-red-500" size={56} />
          <div className="space-y-2">
            <h3 className="text-xl font-black text-green-950">Sensor Feeds Offline</h3>
            <p className="text-sm text-gray-400 leading-relaxed font-semibold">
              {error || "We are experiencing difficulties connecting to the live meteorological data nodes. Smart Krishi Agronomic AI requires active sensor feeds to generate real-time warnings."}
            </p>
          </div>
          <div className="bg-red-50/50 rounded-2xl p-4 border border-red-100/50 max-w-md">
            <p className="text-xs text-red-700 font-bold">
              Emergency Hotline: Call 1800-300-KRISHI (Toll-Free) to consult a duty agronomist manually.
            </p>
          </div>
          <button 
            onClick={loadAdvisories}
            className="px-6 py-3.5 bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs rounded-xl shadow-lg transition"
          >
            Retry Synchronization
          </button>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Agronomic Advisories" icon={ShieldAlert}>
      <div className="space-y-6 font-outfit">
        {/* Active Weather Parameter Card */}
        <div className="bg-green-950 text-white rounded-[32px] p-6 shadow-xl border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <span className="text-[10px] text-green-400 font-extrabold uppercase tracking-wider">Active Telemetry Feed</span>
            <h2 className="text-2xl font-black">{weatherData.city || "Localized Station"}</h2>
            <p className="text-xs opacity-80 font-bold capitalize">Microclimate Feed: {weatherData.weatherDescription}</p>
          </div>
          
          <div className="flex flex-wrap gap-4 md:gap-8">
            <div className="text-center md:text-left">
              <span className="text-[10px] text-green-400 font-bold block uppercase">Temperature</span>
              <span className="text-xl font-mono font-black">{weatherData.temperature}°C</span>
            </div>
            <div className="text-center md:text-left border-l border-white/10 pl-4 md:pl-8">
              <span className="text-[10px] text-green-400 font-bold block uppercase">Humidity</span>
              <span className="text-xl font-mono font-black">{weatherData.humidity}%</span>
            </div>
            <div className="text-center md:text-left border-l border-white/10 pl-4 md:pl-8">
              <span className="text-[10px] text-green-400 font-bold block uppercase">Wind Speed</span>
              <span className="text-xl font-mono font-black">{weatherData.windSpeed} km/h</span>
            </div>
            <div className="text-center md:text-left border-l border-white/10 pl-4 md:pl-8">
              <span className="text-[10px] text-green-400 font-bold block uppercase">Rain Prob</span>
              <span className="text-xl font-mono font-black">{weatherData.rainProbability || 0}%</span>
            </div>
          </div>

          <button 
            onClick={loadAdvisories}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition text-xs font-bold w-full md:w-auto"
          >
            Refresh Feed
          </button>
        </div>

        {/* Dynamic Advisory Cards Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {advisoriesList.map((ad, i) => (
            <div key={i} className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm flex flex-col justify-between hover:border-green-200 transition space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gray-50 rounded-xl">
                      {getAdvisoryIcon(ad.category)}
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-black text-gray-400 block tracking-wider">{ad.category}</span>
                      <h4 className="font-extrabold text-green-950 text-base">{ad.title}</h4>
                    </div>
                  </div>
                  <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex-shrink-0 ${getUrgencyClass(ad.urgency)}`}>
                    {ad.urgency}
                  </span>
                </div>
                
                <p className="text-xs text-gray-500 leading-relaxed font-semibold">{ad.note}</p>
              </div>

              <div className="border-t border-gray-50 pt-3 flex justify-between items-center text-[10px] text-gray-400 font-bold font-mono">
                <span>Trigger condition:</span>
                <span className="bg-gray-50 px-2 py-0.5 rounded text-gray-500">{ad.detail}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageWrapper>
  );
}

// 3. Sales Reports
export function SalesReports() {
  return (
    <PageWrapper title="Merchant Sales Insights" icon={TrendingUp}>
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm text-center max-w-xl mx-auto space-y-6 my-12">
        <TrendingUp className="text-green-600 mx-auto" size={48} />
        <div className="space-y-2">
          <h3 className="text-xl font-black text-green-950">Generating Your Financial Reports</h3>
          <p className="text-sm text-gray-400 font-medium">We are compiling your daily, weekly, and custom billing statements. This includes sales commissions, payouts, and pending order settlements.</p>
        </div>
        <div className="flex justify-center gap-3">
          <button className="px-5 py-3 bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs rounded-xl shadow transition flex items-center gap-1.5">
            <Download size={14} /> Download PDF (May 2026)
          </button>
          <button className="px-5 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl transition">
            Custom Range
          </button>
        </div>
      </div>
    </PageWrapper>
  );
}

// 4. Market Trends
export function MarketTrends() {
  const trends = [
    { crop: "Premium Basmati Rice", price: "₹8,500 / Quintal", change: "+12.4%", status: "UPWARD" },
    { crop: "Hybrid Wheat", price: "₹2,450 / Quintal", change: "-1.8%", status: "DOWNWARD" },
    { crop: "Organic Mustard", price: "₹6,100 / Quintal", change: "+5.6%", status: "UPWARD" },
    { crop: "Raw Cotton", price: "₹7,200 / Quintal", change: "+8.9%", status: "UPWARD" },
  ];

  return (
    <PageWrapper title="Mandi Price Trends" icon={LineChart}>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-gray-800">State Mandi Price Index</h3>
          <div className="space-y-4">
            {trends.map((t, i) => (
              <div key={i} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div>
                  <h4 className="font-extrabold text-green-950">{t.crop}</h4>
                  <p className="text-xs text-gray-400 font-bold mt-0.5">Average Wholesale Price</p>
                </div>
                <div className="text-right">
                  <div className="font-mono font-extrabold text-gray-800">{t.price}</div>
                  <span className={`text-xs font-black ${t.status === "UPWARD" ? "text-green-600" : "text-red-500"}`}>
                    {t.change} {t.status === "UPWARD" ? "▲" : "▼"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-yellow-50/50 border border-yellow-100 rounded-3xl p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h4 className="text-lg font-black text-yellow-950 flex items-center gap-1.5">
              Market Alert
            </h4>
            <p className="text-xs text-yellow-900 leading-relaxed font-semibold">
              Wheat prices are projected to experience high volatility over the next week due to changes in export tariff limits. Farmers are advised to lock in forward sales where possible.
            </p>
          </div>
          <button className="mt-6 bg-yellow-600 hover:bg-yellow-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition shadow">
            Price Analytics Dashboard
          </button>
        </div>
      </div>
    </PageWrapper>
  );
}

// 5. Weather Reports
export function WeatherReports() {
  return (
    <PageWrapper title="Historical Weather Insights" icon={CloudSun}>
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm text-center max-w-xl mx-auto space-y-6 my-12">
        <CloudSun className="text-blue-600 mx-auto animate-pulse" size={48} />
        <div className="space-y-2">
          <h3 className="text-xl font-black text-green-950">Precipitation & Soil Moisture History</h3>
          <p className="text-sm text-gray-400 font-medium">Analyze monsoon performance, heat index history, and ground-water changes. Helping you make data-backed sowing decisions year after year.</p>
        </div>
        <button className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-lg transition">
          Generate Historical Climate Report
        </button>
      </div>
    </PageWrapper>
  );
}

// 6. Address Book
export function AddressBook() {
  return (
    <PageWrapper title="My Shipping Addresses" icon={MapPin}>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 border-2 border-green-600 shadow-sm space-y-4 relative">
          <span className="absolute top-4 right-4 bg-green-50 text-green-700 border border-green-200 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">Primary</span>
          <h4 className="font-extrabold text-green-950 text-base">Ram Prasad Sharma (Home)</h4>
          <p className="text-xs text-gray-500 font-semibold leading-relaxed">
            Near Hanuman Temple, Village Khed, Taluka Haveli,<br />
            Pune District, Maharashtra - 412115
          </p>
          <div className="text-xs text-gray-400 font-bold pt-2">Phone: +91 98765 43210</div>
        </div>
        <div className="border border-dashed border-gray-300 rounded-3xl p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50/50 transition cursor-pointer min-h-36">
          <MapPin className="text-gray-400 mb-2" size={24} />
          <span className="text-xs font-bold text-gray-600">Add New Address</span>
        </div>
      </div>
    </PageWrapper>
  );
}

// 7. Payment Methods
export function PaymentMethods() {
  return (
    <PageWrapper title="Payment Settlement Accounts" icon={CreditCard}>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-extrabold text-green-950 text-sm">State Bank of India</span>
            <span className="bg-green-50 text-green-700 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">UPI Settled</span>
          </div>
          <div className="space-y-1 text-xs text-gray-500 font-semibold">
            <div><strong>A/C Holder:</strong> Ram Prasad Sharma</div>
            <div><strong>Account Num:</strong> &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; 4321</div>
            <div><strong>UPI ID:</strong> ramsharma@sbi</div>
          </div>
        </div>
        <div className="border border-dashed border-gray-300 rounded-3xl p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50/50 transition cursor-pointer min-h-36">
          <CreditCard className="text-gray-400 mb-2" size={24} />
          <span className="text-xs font-bold text-gray-600">Add New Payment Option</span>
        </div>
      </div>
    </PageWrapper>
  );
}

// 8. Settings
export function AppSettings() {
  return (
    <PageWrapper title="Account Settings" icon={Settings}>
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm max-w-2xl space-y-6">
        <div className="space-y-4">
          <h3 className="text-base font-bold text-gray-800">Notification Preferences</h3>
          <div className="space-y-3">
            {[
              { id: "sms", label: "Mandi Price Alerts (SMS)", desc: "Daily wholesale crop price alerts for your state." },
              { id: "weather", label: "Extreme Weather Warnings (Push/SMS)", desc: "Instant storm and temperature notifications." },
              { id: "orders", label: "Order Progress Updates", desc: "Alerts when order status changes to Shipped or Delivered." }
            ].map(opt => (
              <label key={opt.id} className="flex gap-3 items-start cursor-pointer hover:bg-gray-50 p-2.5 rounded-xl transition">
                <input type="checkbox" defaultChecked className="mt-1 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                <div>
                  <span className="text-sm font-bold text-green-950 block">{opt.label}</span>
                  <span className="text-xs text-gray-400 font-semibold">{opt.desc}</span>
                </div>
              </label>
            ))}
          </div>
        </div>
        <button className="bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow transition">
          Save Settings Profile
        </button>
      </div>
    </PageWrapper>
  );
}

// 9. Help Center
export function SearchableFaq() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [expandedFaq, setExpandedFaq] = useState(null);

  const categories = ["ALL", ...faqData.map(c => c.category)];

  const filteredData = faqData.map(cat => {
    const matchedFaqs = cat.faqs.filter(faq => 
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
      faq.a.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return {
      ...cat,
      faqs: matchedFaqs
    };
  }).filter(cat => cat.faqs.length > 0 && (selectedCategory === "ALL" || cat.category === selectedCategory));

  return (
    <div className="space-y-6 font-outfit">
      {/* Search and Category Filter Section */}
      <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search FAQs (e.g. registration, payment, returns, escrow)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-medium transition"
          />
        </div>

        {/* Categories Pills */}
        <div className="flex flex-wrap gap-2 pt-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setExpandedFaq(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                selectedCategory === cat
                  ? "bg-green-600 text-white shadow-md shadow-green-600/10"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* FAQs List */}
      <div className="space-y-6">
        {filteredData.length === 0 ? (
          <div className="bg-white rounded-[32px] p-12 text-center border border-gray-100 shadow-sm">
            <HelpCircle className="text-gray-300 mx-auto mb-4" size={48} />
            <h4 className="text-lg font-bold text-gray-700">No matching questions found</h4>
            <p className="text-sm text-gray-400 mt-1">Try refining your search terms or choosing a different category.</p>
          </div>
        ) : (
          filteredData.map((catGroup) => (
            <div key={catGroup.category} className="space-y-3">
              <h3 className="text-xs uppercase font-black text-green-700 tracking-wider pl-1">{catGroup.category}</h3>
              <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-100">
                {catGroup.faqs.map((faq, index) => {
                  const faqKey = `${catGroup.category}-${index}`;
                  const isExpanded = expandedFaq === faqKey;
                  return (
                    <div key={faq.q} className="transition-colors hover:bg-gray-50/30">
                      <button
                        onClick={() => setExpandedFaq(isExpanded ? null : faqKey)}
                        className="w-full flex items-center justify-between p-5 text-left font-bold text-green-950 text-sm focus:outline-none"
                      >
                        <span>{faq.q}</span>
                        {isExpanded ? (
                          <ChevronUp className="text-green-600" size={18} />
                        ) : (
                          <ChevronDown className="text-gray-400" size={18} />
                        )}
                      </button>
                      {isExpanded && (
                        <div className="px-5 pb-5 pt-1 text-xs text-gray-500 font-semibold leading-relaxed animate-fadeIn">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function HelpCenter() {
  return (
    <PageWrapper title="Help Center" icon={HelpCircle}>
      <div className="space-y-8">
        <div className="grid md:grid-cols-2 gap-6">
          {[
            { q: "How do I list my crop crops?", a: "Go to Seller Center > Add Product. Fill out the crop name, price, variety, unit weight, and upload a clean photo." },
            { q: "How does the escrow payment work?", a: "When a buyer orders, their payment is held by Smart Krishi. Once the delivery agent or buyer confirms delivery, funds are instantly settled into your bank account." },
            { q: "Can I rent tractors on the platform?", a: "Yes, go to the Agriculture Marketplace > Machinery, select a machine, select your date slot, pay the security deposit, and book." },
            { q: "What is the return policy?", a: "Standard marketplace items have a 7-day return policy if the quality does not match description. Dairy and fresh crops cannot be returned after delivery confirmation." }
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-2">
              <h4 className="font-extrabold text-green-950 text-base">{item.q}</h4>
              <p className="text-xs text-gray-500 leading-relaxed font-semibold">{item.a}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100 pt-8">
          <h2 className="text-xl font-black text-green-950 mb-6 pl-1">Search Our Knowledge Base</h2>
          <SearchableFaq />
        </div>
      </div>
    </PageWrapper>
  );
}

// 10. Contact Support
export function ContactSupport() {
  const [user, setUser] = useState(null);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("BUG_REPORT");
  const [priority, setPriority] = useState("MEDIUM");
  const [description, setDescription] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [screenshotPreview, setScreenshotPreview] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result);
        // Simulate an uploaded URL
        setScreenshotUrl("https://images.unsplash.com/photo-1589254065878-42c9da997008?auto=format&fit=crop&w=800&q=80");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError("Please log in to submit a ticket.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await api.post("/feedback", {
        category,
        subject,
        description,
        priority,
        screenshotUrl
      });
      setSuccess("Support ticket raised successfully! Support team will email you shortly.");
      setSubject("");
      setDescription("");
      setScreenshotUrl("");
      setScreenshotPreview("");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to submit support request.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <PageWrapper title="Connect with Support" icon={Mail}>
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm text-center max-w-xl mx-auto space-y-6 my-12 font-outfit">
          <Mail className="text-green-600 mx-auto" size={48} />
          <div className="space-y-2">
            <h3 className="text-xl font-black text-green-950">Authentication Required</h3>
            <p className="text-sm text-gray-400 font-medium">You must be logged in to submit a bug report, suggestion, or complaint to our administration team.</p>
          </div>
          <Link to="/account" className="inline-block px-6 py-3.5 bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs rounded-xl shadow-lg transition">
            Login to Your Account
          </Link>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Connect with Support" icon={Mail}>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-gray-800 font-outfit">Support Request Form</h3>
          {success && (
            <div className="bg-green-50 text-green-800 p-4 rounded-xl border border-green-200 text-sm font-semibold">
              {success}
            </div>
          )}
          {error && (
            <div className="bg-red-50 text-red-800 p-4 rounded-xl border border-red-200 text-sm font-semibold">
              {error}
            </div>
          )}
          <form className="space-y-4 font-outfit" onSubmit={handleSubmit}>
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Subject</label>
              <input 
                type="text" 
                required
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Brief summary of the issue..."
                className="border border-gray-300 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" 
              />
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Category</label>
                <select 
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="border border-gray-300 p-3 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="BUG_REPORT">Bug Report</option>
                  <option value="SUGGESTION">Suggestion</option>
                  <option value="COMPLAINT">Complaint</option>
                  <option value="FEATURE_REQUEST">Feature Request</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Priority</label>
                <select 
                  value={priority}
                  onChange={e => setPriority(e.target.value)}
                  className="border border-gray-300 p-3 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Detailed Description</label>
              <textarea 
                required 
                rows={4} 
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Please explain your issue, suggestion, or complaint in detail..." 
                className="border border-gray-300 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" 
              />
            </div>

            <div className="flex flex-col space-y-2">
              <label className="text-xs font-bold text-gray-500 pl-1">Screenshot Upload (Optional)</label>
              <div className="flex items-center gap-4">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange}
                  className="text-xs text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer"
                />
                {screenshotPreview && (
                  <img 
                    src={screenshotPreview} 
                    alt="Preview" 
                    className="w-16 h-16 object-cover rounded-xl border border-gray-200"
                  />
                )}
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-extrabold text-xs px-6 py-3.5 rounded-xl shadow transition cursor-pointer"
            >
              {loading ? "Submitting..." : "Raise Support Ticket"}
            </button>
          </form>
        </div>
        <div className="bg-green-950 text-white rounded-3xl p-6 shadow-lg flex flex-col justify-between h-fit space-y-6 font-outfit">
          <div className="space-y-4">
            <h4 className="text-lg font-black text-green-300">Helpline & Support</h4>
            <p className="text-xs opacity-90 leading-relaxed font-semibold">Our customer success and agronomy hotline is available 24/7.</p>
            
            <div className="space-y-4 pt-2">
              <div className="flex flex-col space-y-1 bg-white/5 p-3 rounded-2xl border border-white/10">
                <span className="text-[10px] text-green-400 font-extrabold uppercase tracking-wider">Support Line 1</span>
                <div className="flex flex-col gap-2">
                  <span className="font-mono font-bold text-sm text-white">6262782714</span>
                  <div className="flex gap-2">
                    <a href="tel:6262782714" title="Call Support" className="flex-1 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition flex items-center justify-center gap-1 text-[10px] font-bold">
                      <Phone size={12} /> Call
                    </a>
                    <a href="https://wa.me/916262782714" target="_blank" rel="noopener noreferrer" title="WhatsApp Message" className="flex-1 py-1.5 bg-green-600/30 hover:bg-green-600/50 text-green-300 rounded-lg transition flex items-center justify-center gap-1 text-[10px] font-bold">
                      <MessageSquare size={12} /> WhatsApp
                    </a>
                    <a href="sms:6262782714" title="SMS Message" className="flex-1 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 rounded-lg transition flex items-center justify-center gap-1 text-[10px] font-bold">
                      <Send size={12} /> SMS
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex flex-col space-y-1 bg-white/5 p-3 rounded-2xl border border-white/10">
                <span className="text-[10px] text-green-400 font-extrabold uppercase tracking-wider">Support Line 2</span>
                <div className="flex flex-col gap-2">
                  <span className="font-mono font-bold text-sm text-white">9669115169</span>
                  <div className="flex gap-2">
                    <a href="tel:9669115169" title="Call Support" className="flex-1 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition flex items-center justify-center gap-1 text-[10px] font-bold">
                      <Phone size={12} /> Call
                    </a>
                    <a href="https://wa.me/919669115169" target="_blank" rel="noopener noreferrer" title="WhatsApp Message" className="flex-1 py-1.5 bg-green-600/30 hover:bg-green-600/50 text-green-300 rounded-lg transition flex items-center justify-center gap-1 text-[10px] font-bold">
                      <MessageSquare size={12} /> WhatsApp
                    </a>
                    <a href="sms:9669115169" title="SMS Message" className="flex-1 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 rounded-lg transition flex items-center justify-center gap-1 text-[10px] font-bold">
                      <Send size={12} /> SMS
                    </a>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-base font-black font-mono tracking-wider pt-2 text-green-400 text-center border-t border-white/10">
              1800-300-KRISHI (Toll Free)
            </div>
          </div>
          
          <div className="text-xs text-gray-400 font-bold border-t border-white/10 pt-4 flex flex-col space-y-1">
            <span>Email support:</span>
            <a href="mailto:smartkrishi2026@gmail.com" className="text-green-300 hover:underline font-semibold">
              smartkrishi2026@gmail.com
            </a>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

export function FaqPage() {
  return (
    <PageWrapper title="Frequently Asked Questions" icon={FileQuestion}>
      <SearchableFaq />
    </PageWrapper>
  );
}
