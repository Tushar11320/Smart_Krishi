import React, { useEffect, useState, useCallback } from "react";
import WeatherCard from "../components/WeatherCard";
import ForecastCard from "../components/ForecastCard";
import WeatherService from "../services/WeatherService";
import { Search, MapPin, RefreshCw, AlertTriangle, Lightbulb, CloudSun } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function Weather() {
  const [cityInput, setCityInput] = useState(() => {
    return localStorage.getItem("lastSearchedCity") || "Bhopal";
  });
  const [loading, setLoading] = useState(false);
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [searchMode, setSearchMode] = useState(() => {
    const savedCity = localStorage.getItem("lastSearchedCity") || "Bhopal";
    return { type: "city", value: savedCity };
  });
  const [error, setError] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const commonCities = ["Bhopal", "Indore", "Mumbai", "Delhi", "Pune", "Bengaluru", "Chennai", "Kolkata", "Hyderabad", "Ahmedabad", "Jaipur", "Lucknow", "Gwalior", "Jabalpur", "Ujjain"];
  const suggestions = cityInput.trim().length >= 2 
    ? commonCities.filter(c => c.toLowerCase().startsWith(cityInput.trim().toLowerCase()) && c.toLowerCase() !== cityInput.trim().toLowerCase())
    : [];

  const fetchWeatherData = useCallback(async (mode) => {
    const activeMode = mode || searchMode;
    setLoading(true);
    setError(null);

    try {
      if (activeMode.type === "city") {
        const city = activeMode.value;
        const currentData = await WeatherService.getCurrentWeather(city);
        setWeather(currentData);
        
        const forecastData = await WeatherService.getForecast(city);
        setForecast(forecastData);
        // Save the successful searched city in localStorage
        localStorage.setItem("lastSearchedCity", city);
      } else {
        const { lat, lon, city } = activeMode.value;
        const currentData = await WeatherService.getWeatherByCoordinates(lat, lon);
        setWeather(currentData);
        
        const forecastData = await WeatherService.getForecast(city || currentData.city);
        setForecast(forecastData);
        setCityInput(currentData.city);
        localStorage.setItem("lastSearchedCity", currentData.city);
      }
      return true;
    } catch (err) {
      console.error("Error fetching weather data:", err);
      let errMsg = "";
      if (!err.response) {
        errMsg = "Network error. Weather service is currently unavailable. Please try again later.";
      } else if (err.response.status === 404) {
        errMsg = err.response.data?.message || "Location not found. Try searching with city, state, and country.";
      } else if (
        err.response.status === 401 || 
        err.response.status === 403 || 
        (err.response.status === 400 && err.response.data?.message?.includes("API Key"))
      ) {
        errMsg = "Invalid Weather API key configuration. Please contact administrator.";
      } else if (err.response.status >= 500) {
        errMsg = "Backend server error. Failed to retrieve weather details.";
      } else {
        errMsg = err.response.data?.message || err.message || "Error synchronizing live weather statistics.";
      }
      toast.error(errMsg);
      setError(errMsg);
      setWeather(null);
      setForecast(null);
      return false;
    } finally {
      setLoading(false);
    }
  }, [searchMode]);

  const loadMockData = (city) => {
    const formattedCity = city.charAt(0).toUpperCase() + city.slice(1);
    setWeather({
      city: formattedCity,
      temperature: 29.4,
      feelsLike: 31.2,
      humidity: 62,
      windSpeed: 8.5,
      visibility: 10000,
      weatherCondition: "Clouds",
      weatherDescription: "scattered clouds (demo)",
      rainProbability: 10.0,
      sunrise: Math.round(Date.now() / 1000) - 20000,
      sunset: Math.round(Date.now() / 1000) + 20000,
      airQualityIndex: 2,
      latitude: 23.2599,
      longitude: 77.4126,
      alerts: ["⚠️ Demo Mode: Displaying offline weather details."],
      recommendations: [
        "Ideal conditions for general field maintenance.",
        "Soil moisture is normal. Monitor crop hydration rates.",
        "Pesticide application can proceed under gentle wind speed."
      ]
    });

    setForecast({
      city: formattedCity,
      forecasts: [
        { dateTime: "2026-06-20 12:00:00", dayOfWeek: "Sat", temperature: 30.5, feelsLike: 32.1, humidity: 60, windSpeed: 9.0, weatherCondition: "Clouds", weatherDescription: "scattered clouds", rainProbability: 15.0 },
        { dateTime: "2026-06-21 12:00:00", dayOfWeek: "Sun", temperature: 31.0, feelsLike: 33.4, humidity: 58, windSpeed: 8.0, weatherCondition: "Clear", weatherDescription: "clear sky", rainProbability: 5.0 },
        { dateTime: "2026-06-22 12:00:00", dayOfWeek: "Mon", temperature: 28.0, feelsLike: 30.2, humidity: 75, windSpeed: 14.2, weatherCondition: "Rain", weatherDescription: "light rain", rainProbability: 65.0 },
        { dateTime: "2026-06-23 12:00:00", dayOfWeek: "Tue", temperature: 27.5, feelsLike: 29.0, humidity: 80, windSpeed: 18.5, weatherCondition: "Rain", weatherDescription: "moderate rain", rainProbability: 80.0 },
        { dateTime: "2026-06-24 12:00:00", dayOfWeek: "Wed", temperature: 29.0, feelsLike: 31.5, humidity: 70, windSpeed: 10.1, weatherCondition: "Clouds", weatherDescription: "broken clouds", rainProbability: 25.0 }
      ]
    });
  };

  useEffect(() => {
    const savedCity = localStorage.getItem("lastSearchedCity") || "Bhopal";
    fetchWeatherData({ type: "city", value: savedCity });
  }, []);

  // Auto-refresh every 30 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      toast.success("Updating live weather dashboard...", { icon: "🔄" });
      fetchWeatherData();
    }, 1800000); // 30 minutes
    return () => clearInterval(interval);
  }, [fetchWeatherData]);

  const handleSearch = () => {
    const cleanInput = cityInput.trim();
    if (!cleanInput) {
      toast.error("Please enter a city name");
      return;
    }
    const cityRegex = /^[a-zA-Z\s,\-]+$/;
    if (!cityRegex.test(cleanInput)) {
      toast.error("Please enter a valid city name containing only letters.");
      return;
    }
    setShowSuggestions(false);
    const newMode = { type: "city", value: cleanInput };
    setSearchMode(newMode);
    fetchWeatherData(newMode);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleGPSLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    const toastId = toast.loading("Locating GPS coordinates...");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const currentData = await WeatherService.getWeatherByCoordinates(latitude, longitude);
          setWeather(currentData);

          const forecastData = await WeatherService.getForecast(currentData.city);
          setForecast(forecastData);

          const newMode = {
            type: "coords",
            value: { lat: latitude, lon: longitude, city: currentData.city }
          };
          setSearchMode(newMode);
          setCityInput(currentData.city);
          localStorage.setItem("lastSearchedCity", currentData.city);
          toast.success(`Weather loaded for ${currentData.city}`, { id: toastId });
        } catch (err) {
          console.error("GPS fetch error:", err);
          let errMsg = "";
          if (!err.response) {
            errMsg = "Network error. Weather service is currently unavailable. Please try again later.";
          } else if (err.response.status === 404) {
            errMsg = err.response.data?.message || "Location not found. Try searching with city, state, and country.";
          } else if (
            err.response.status === 401 || 
            err.response.status === 403 || 
            (err.response.status === 400 && err.response.data?.message?.includes("API Key"))
          ) {
            errMsg = "Invalid Weather API key configuration. Please contact administrator.";
          } else if (err.response.status >= 500) {
            errMsg = "Backend server error. Failed to retrieve weather details.";
          } else {
            errMsg = err.response.data?.message || err.message || "Could not fetch weather for coordinates.";
          }
          toast.error(errMsg, { id: toastId });
          setError(errMsg);
          setWeather(null);
          setForecast(null);
        }
      },
      (error) => {
        console.error("GPS access error:", error);
        toast.error("GPS Access Denied. Search manually instead.", { id: toastId });
      }
    );
  };

  const handleManualRefresh = async () => {
    toast.loading("Refreshing weather statistics...", { id: "refresh" });
    const success = await fetchWeatherData();
    if (success) {
      toast.success("Dashboard updated successfully!", { id: "refresh" });
    } else {
      toast.dismiss("refresh");
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-emerald-50/40 via-white to-green-50/40 px-4 md:px-8 py-10 font-outfit">
      <Toaster position="top-right" />
      
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-600/10 text-emerald-700 rounded-xl">
                <CloudSun size={28} className="animate-pulse" />
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-emerald-950 font-outfit tracking-tight">
                Farmer Weather Advisory
              </h1>
            </div>
            <p className="text-emerald-800/70 font-medium text-sm mt-1">
              Real-time weather reports and actionable farming recommendations
            </p>
          </div>

          {/* Search Controls */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative flex-grow md:flex-grow-0">
              <input
                type="text"
                value={cityInput}
                onChange={(e) => {
                  setCityInput(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onKeyDown={handleKeyPress}
                placeholder="Search city (e.g., Bhopal)..."
                className="w-full md:w-64 pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-emerald-100 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 font-semibold text-emerald-950 shadow-sm transition-all text-sm"
              />
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-700/40" />
              
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-emerald-100 rounded-2xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                  {suggestions.map((city, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setCityInput(city);
                        setShowSuggestions(false);
                        const newMode = { type: "city", value: city };
                        setSearchMode(newMode);
                        fetchWeatherData(newMode);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-emerald-50/50 text-emerald-950 font-semibold text-sm transition-all border-b border-emerald-100/50 last:border-0 cursor-pointer"
                    >
                      {city}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white font-bold px-5 py-2.5 rounded-2xl flex items-center gap-2 shadow-md shadow-emerald-600/10 hover:shadow-emerald-700/20 active:scale-95 transition-all text-sm cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="animate-spin" size={16} />
                  Searching...
                </>
              ) : (
                "Search"
              )}
            </button>

            <button
              onClick={handleGPSLocation}
              title="Use Current Location"
              className="p-3 bg-white hover:bg-emerald-50/50 text-emerald-700 border border-emerald-100 rounded-2xl active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              <MapPin size={18} />
            </button>

            <button
              onClick={handleManualRefresh}
              disabled={loading}
              title="Refresh Dashboard"
              className={`p-3 bg-white hover:bg-emerald-50/50 text-emerald-700 border border-emerald-100 rounded-2xl active:scale-95 transition-all shadow-sm cursor-pointer ${loading ? 'animate-spin' : ''}`}
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-8 bg-red-50/20 border border-red-200/50 backdrop-blur-md rounded-3xl max-w-2xl mx-auto text-center space-y-4 shadow-sm">
            <AlertTriangle className="mx-auto text-red-600" size={48} />
            <h3 className="font-bold text-red-950 text-lg">
              {error.includes("Location not found") ? "Location Not Found" : "Unable to Retrieve Live Weather"}
            </h3>
            <p className="text-sm font-semibold text-red-700/80 bg-white border border-red-100/50 rounded-xl p-3.5 shadow-inner">
              {error}
            </p>
            {!error.includes("Location not found") && (
              <button
                onClick={() => fetchWeatherData()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-2xl active:scale-95 transition-all text-sm cursor-pointer shadow-md inline-flex items-center gap-2"
              >
                <RefreshCw size={16} /> Retry Connection
              </button>
            )}
          </div>
        )}

        {/* Loading Indicator */}
        {loading && !weather ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] bg-white/40 border border-emerald-50/50 backdrop-blur-sm rounded-3xl p-10">
            <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-emerald-950 font-bold text-sm">Aggregating live weather feeds...</p>
          </div>
        ) : (
          !error && weather && (
            <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 transition-opacity duration-300 ${loading ? "opacity-60 pointer-events-none" : ""}`}>
              
              {/* Column 1 & 2: Current Weather & Forecast */}
              <div className="lg:col-span-2 space-y-8">
                {/* Weather card */}
                <WeatherCard weather={weather} />

                {/* Advisories & Alerts (shown on mobile first/middle) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:hidden">
                  {/* Alerts */}
                  <div className={`p-6 rounded-3xl border ${weather.alerts && weather.alerts.length > 0 ? 'bg-red-50/40 border-red-200/50' : 'bg-emerald-50/20 border-emerald-100/50'} backdrop-blur-md`}>
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle size={20} className={weather.alerts && weather.alerts.length > 0 ? "text-red-600" : "text-emerald-600"} />
                      <h3 className="font-bold text-emerald-950 text-base">Weather Warnings</h3>
                    </div>
                    {weather.alerts && weather.alerts.length > 0 ? (
                      <ul className="space-y-2">
                        {weather.alerts.map((alert, i) => (
                          <li key={i} className="text-xs font-bold text-red-700 bg-red-50 border border-red-100/30 rounded-xl p-2.5">
                            {alert}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs font-semibold text-emerald-700/80 bg-emerald-50/50 border border-emerald-100/30 rounded-xl p-2.5">
                        No immediate weather hazards reported. Safe agricultural operations.
                      </p>
                    )}
                  </div>

                  {/* Recommendations */}
                  <div className="p-6 bg-amber-50/20 border border-amber-100/50 backdrop-blur-md rounded-3xl">
                    <div className="flex items-center gap-2 mb-4">
                      <Lightbulb size={20} className="text-amber-600" />
                      <h3 className="font-bold text-emerald-950 text-base">Crop Advisories</h3>
                    </div>
                    <ul className="space-y-3">
                      {weather.recommendations && weather.recommendations.map((rec, i) => (
                        <li key={i} className="text-xs text-amber-900 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/10 rounded-xl p-2.5 flex items-start gap-2 leading-relaxed transition-all">
                          <span className="text-amber-500 font-extrabold mt-0.5">•</span>
                          <span className="font-semibold">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 5-Day forecast */}
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-emerald-950 font-outfit tracking-tight">
                    5-Day Agricultural Outlook
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {forecast && forecast.forecasts && forecast.forecasts.map((day, idx) => (
                      <ForecastCard key={idx} forecast={day} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Column 3: Alerts & Advisories (Desktop sidebar) */}
              <div className="hidden lg:block lg:col-span-1 space-y-8">
                
                {/* Active Alerts */}
                <div className={`p-6 rounded-3xl border ${weather.alerts && weather.alerts.length > 0 ? 'bg-red-50/40 border-red-200/50 shadow-md' : 'bg-emerald-50/20 border-emerald-100/50 shadow-sm'} backdrop-blur-md transition-all`}>
                  <div className="flex items-center gap-2.5 mb-4">
                    <AlertTriangle size={22} className={weather.alerts && weather.alerts.length > 0 ? "text-red-600 animate-bounce-slow" : "text-emerald-600"} />
                    <h3 className="font-bold text-emerald-950 text-lg">Active Alerts</h3>
                  </div>
                  {weather.alerts && weather.alerts.length > 0 ? (
                    <ul className="space-y-3">
                      {weather.alerts.map((alert, i) => (
                        <li key={i} className="text-xs font-bold text-red-700 bg-white border border-red-200 rounded-xl p-3.5 shadow-sm">
                          {alert}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs font-semibold text-emerald-700/80 bg-white border border-emerald-100/50 rounded-xl p-3.5 shadow-inner">
                      No weather anomalies or emergency advisories active. General operations can continue smoothly.
                    </p>
                  )}
                </div>

                {/* Farming Recommendations */}
                <div className="p-6 bg-gradient-to-br from-amber-50/30 to-amber-50/10 border border-amber-100/50 backdrop-blur-md rounded-3xl shadow-sm">
                  <div className="flex items-center gap-2.5 mb-4">
                    <Lightbulb size={22} className="text-amber-500 animate-pulse" />
                    <h3 className="font-bold text-emerald-950 text-lg">Crop Advisories</h3>
                  </div>
                  <ul className="space-y-3.5">
                    {weather.recommendations && weather.recommendations.map((rec, i) => (
                      <li key={i} className="text-xs text-amber-900 bg-white hover:bg-amber-50/50 border border-amber-200/50 rounded-xl p-3.5 flex items-start gap-2 shadow-sm leading-relaxed transition-all">
                        <span className="text-amber-500 font-extrabold text-sm leading-none">•</span>
                        <span className="font-semibold">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

            </div>
          )
        )}
      </div>
    </div>
  );
}