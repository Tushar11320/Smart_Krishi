import React, { useState } from "react";
import {
  Wheat,
  ShoppingCart,
  MapPin,
  Star,
  ShieldCheck,
} from "lucide-react";

export default function CropCard() {
  const [added, setAdded] = useState(false);

  const crop = {
    name: "Premium Soyabean",
    category: "Agriculture Crop",
    price: 1800,
    location: "Bhopal, Madhya Pradesh",
    rating: 4.8,
    stock: "In Stock",
    image:
      "https://images.unsplash.com/photo-1601593768799-76d7b79b4b63",
  };

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-sm hover:scale-105 transition duration-300">

        {/* IMAGE */}
        <div className="relative">
          <img
            src={crop.image}
            alt={crop.name}
            className="w-full h-64 object-cover"
          />

          {/* CATEGORY */}
          <div className="absolute top-4 left-4 bg-green-600 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
            {crop.category}
          </div>

          {/* STOCK */}
          <div className="absolute top-4 right-4 bg-yellow-400 text-black px-4 py-1 rounded-full text-sm font-bold shadow-lg">
            {crop.stock}
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-6">

          {/* TITLE */}
          <div className="flex items-center gap-2 mb-3">
            <Wheat className="text-green-600" size={26} />

            <h2 className="text-2xl font-bold text-gray-800">
              {crop.name}
            </h2>
          </div>

          {/* LOCATION */}
          <div className="flex items-center gap-2 text-gray-500 mb-3">
            <MapPin size={18} />
            <span>{crop.location}</span>
          </div>

          {/* RATING */}
          <div className="flex items-center gap-2 mb-4">
            <Star className="text-yellow-500 fill-yellow-500" size={20} />

            <span className="font-semibold text-gray-700">
              {crop.rating} Rating
            </span>
          </div>

          {/* INSURANCE */}
          <div className="flex items-center gap-2 bg-green-100 text-green-700 p-3 rounded-xl mb-5">
            <ShieldCheck size={20} />

            <span className="font-medium">
              Crop Insurance Available
            </span>
          </div>

          {/* PRICE */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-gray-500 text-sm">Price</p>

              <h3 className="text-3xl font-bold text-green-700">
                ₹{crop.price}
              </h3>
            </div>

            <button
              onClick={() => setAdded(!added)}
              className={`px-5 py-3 rounded-xl text-white font-bold flex items-center gap-2 transition duration-300 ${
                added
                  ? "bg-gray-700"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              <ShoppingCart size={20} />

              {added ? "Added" : "Add Cart"}
            </button>
          </div>

          {/* BUTTONS */}
          <div className="flex gap-3">

            <button className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 rounded-xl transition">
              Buy Now
            </button>

            <button className="flex-1 border-2 border-green-600 text-green-700 hover:bg-green-100 font-bold py-3 rounded-xl transition">
              Details
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}