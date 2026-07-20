import api from "./api";

const WeatherService = {
  getCurrentWeather: async (city) => {
    const response = await api.get(`/api/weather/current?city=${encodeURIComponent((city || "").trim())}`, { timeout: 30000 });
    return response.data;
  },

  getForecast: async (city) => {
    const response = await api.get(`/api/weather/forecast?city=${encodeURIComponent((city || "").trim())}`, { timeout: 30000 });
    return response.data;
  },

  getWeatherByCoordinates: async (lat, lon) => {
    const response = await api.get(`/api/weather/location`, {
      params: { lat, lon },
      timeout: 30000
    });
    return response.data;
  },

  getAirQuality: async (lat, lon) => {
    const response = await api.get(`/api/weather/air-quality`, {
      params: { lat, lon },
      timeout: 30000
    });
    return response.data;
  }
};

export default WeatherService;
