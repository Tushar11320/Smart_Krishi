import api from "./api";

const WeatherService = {
  getCurrentWeather: async (city) => {
    const response = await api.get(`/weather/current`, {
      params: { city }
    });
    return response.data;
  },

  getForecast: async (city) => {
    const response = await api.get(`/weather/forecast`, {
      params: { city }
    });
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
