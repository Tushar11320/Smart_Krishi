import api from "./api";

const MapsService = {
  saveUserLocation: async (lat, lon) => {
    const response = await api.post("/location/save", null, {
      params: { lat, lon }
    });
    return response.data;
  },

  getCurrentLocation: async () => {
    const response = await api.get("/location/current");
    return response.data;
  },

  geocode: async (address) => {
    const response = await api.get("/maps/geocode", {
      params: { address }
    });
    return response.data;
  },

  reverseGeocode: async (lat, lon) => {
    const response = await api.get("/maps/reverse-geocode", {
      params: { lat, lon }
    });
    return response.data;
  },

  getDistance: async (originLat, originLon, destLat, destLon) => {
    const response = await api.get("/maps/distance", {
      params: { originLat, originLon, destLat, destLon }
    });
    return response.data;
  },

  saveDeliveryZone: async (sellerId, radiusKm, centerLat, centerLon) => {
    const response = await api.post("/location/delivery-zone", null, {
      params: { sellerId, radiusKm, centerLat, centerLon }
    });
    return response.data;
  },

  checkDeliveryServiceability: async (sellerId, customerLat, customerLon) => {
    const response = await api.get("/location/delivery-zone/check", {
      params: { sellerId, customerLat, customerLon }
    });
    return response.data;
  },

  getNearbyProducts: async (lat, lon, radius, sortBy) => {
    const response = await api.get("/products/nearby", {
      params: { lat, lon, radius, sortBy }
    });
    return response.data;
  },

  updateOrderTracking: async (orderId, lat, lon, speed, timestamp) => {
    const response = await api.post("/order-tracking/update", null, {
      params: { orderId, latitude: lat, longitude: lon, speed, timestamp }
    });
    return response.data;
  },

  getOrderTracking: async (orderId) => {
    const response = await api.get(`/order-tracking/${orderId}`);
    return response.data;
  }
};

export default MapsService;
