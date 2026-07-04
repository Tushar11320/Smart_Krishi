const getWeather = async (req, res) => {
  try {
    res.json({
      city: "Raipur",
      temperature: "36°C",
      humidity: "65%",
      rainfall: "20%",
      windSpeed: "10 km/h",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  getWeather,
};