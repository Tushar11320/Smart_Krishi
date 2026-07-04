const mockData = {

  products: [
    {
      id: 1,
      name: "Modern Tractor",
      price: 450000,
      image:
        "https://images.unsplash.com/photo-1592982537447-6f2a6a0d4f4d",
      category: "Machinery",
    },

    {
      id: 2,
      name: "Fresh Wheat",
      price: 2500,
      image:
        "https://images.unsplash.com/photo-1464226184884-fa280b87c399",
      category: "Crop",
    },

    {
      id: 3,
      name: "Organic Milk",
      price: 70,
      image:
        "https://images.unsplash.com/photo-1560493676-04071c5f467b",
      category: "Milk",
    },

    {
      id: 4,
      name: "Farming Land",
      price: 1200000,
      image:
        "https://images.unsplash.com/photo-1501004318641-b39e6451bec6",
      category: "Land",
    },
  ],

  weather: {
    city: "Bhopal",
    temperature: "32°C",
    humidity: "65%",
    condition: "Sunny",
  },

  marketPrices: [
    {
      crop: "Wheat",
      price: "₹2500/quintal",
    },

    {
      crop: "Rice",
      price: "₹3100/quintal",
    },

    {
      crop: "Soybean",
      price: "₹4500/quintal",
    },
  ],
};

export default mockData;