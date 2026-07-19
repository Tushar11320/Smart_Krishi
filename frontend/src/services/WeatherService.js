import api from "./api";

const WeatherService = {
  getCurrentWeather: async (city) => {
    const response = await api.get(`/weather/current?city=${encodeURIComponent((city || "").trim())}`);
    return response.data;
  },

  getForecast: async (city) => {
    const response = await api.get(`/weather/forecast?city=${encodeURIComponent((city || "").trim())}`);
    return response.data;
  },

  getWeatherByCoordinates: async (lat, lon) => {
    const response = await api.get(`/weather/location`, {
      params: { lat, lon }
    });
    return response.data;
  },

  getAirQuality: async (lat, lon) => {
    const response = await api.get(`/weather/air-quality`, {
      params: { lat, lon }
    });
    return response.data;
  }
};

export default WeatherService;
