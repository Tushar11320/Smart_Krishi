import React from "react";
import {
  TrendingUp,
  TrendingDown,
  Wheat,
  Leaf,
  ShoppingCart,
  ArrowRight,
  Calendar,
} from "lucide-react";

const prices = [
  {
    id: 1,
    crop: "Wheat",
    market: "Bhopal Mandi",
    price: "₹ 2,450 / Quintal",
    change: "+5%",
    trend: "up",
    image:
      "https://images.unsplash.com/photo-1464226184884-fa280b87c399",
  },

  {
    id: 2,
    crop: "Rice",
    market: "Indore Mandi",
    price: "₹ 3,200 / Quintal",
    change: "-2%",
    trend: "down",
    image:
      "https://images.unsplash.com/photo-1501004318641-b39e6451bec6",
  },

  {
    id: 3,
    crop: "Soybean",
    market: "Sehore Mandi",
    price: "₹ 4,100 / Quintal",
    change: "+8%",
    trend: "up",
    image:
      "https://images.unsplash.com/photo-1471193945509-9ad0617afabf",
  },

  {
    id: 4,
    crop: "Corn",
    market: "Hoshangabad Mandi",
    price: "₹ 2,900 / Quintal",
    change: "+3%",
    trend: "up",
    image:
      "https://images.unsplash.com/photo-1499529112087-3cb3b73cec95",
  },
];

export default function MarketPrice() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-green-100">

      {/* Hero Section */}
      <div className="relative h-[65vh] overflow-hidden">

        <img
          src="https://images.unsplash.com/photo-1464226184884-fa280b87c399"
          alt="Market Prices"
          className="absolute w-full h-full object-cover"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/60"></div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center h-full text-center text-white px-6">

          <div className="bg-yellow-500/20 backdrop-blur-lg px-6 py-3 rounded-full border border-yellow-300/20 mb-6 flex items-center gap-3">

            <TrendingUp size={28} />

            <span className="font-semibold text-lg">
              Live Agriculture Market
            </span>

          </div>

          <h1 className="text-6xl md:text-7xl font-black leading-tight">

            Live Market <br />
            Crop Prices

          </h1>

          <p className="max-w-3xl mt-6 text-lg text-gray-200 leading-8">

            Track real-time mandi prices of wheat, rice,
            soybean, corn and other agriculture products.

          </p>

          <button className="mt-10 bg-yellow-500 hover:bg-yellow-600 text-black px-10 py-5 rounded-2xl text-xl font-bold shadow-2xl transition">

            Explore Prices

          </button>
        </div>
      </div>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-8 py-20">

        <div className="grid md:grid-cols-4 gap-8">

          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center hover:-translate-y-2 transition">

            <Wheat
              size={50}
              className="mx-auto text-yellow-500"
            />

            <h2 className="text-4xl font-black mt-5">
              120+
            </h2>

            <p className="text-gray-500 mt-3">
              Crops Listed
            </p>

          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center hover:-translate-y-2 transition">

            <Leaf
              size={50}
              className="mx-auto text-green-600"
            />

            <h2 className="text-4xl font-black mt-5">
              50+
            </h2>

            <p className="text-gray-500 mt-3">
              Mandi Markets
            </p>

          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center hover:-translate-y-2 transition">

            <ShoppingCart
              size={50}
              className="mx-auto text-blue-500"
            />

            <h2 className="text-4xl font-black mt-5">
              10K+
            </h2>

            <p className="text-gray-500 mt-3">
              Daily Traders
            </p>

          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center hover:-translate-y-2 transition">

            <Calendar
              size={50}
              className="mx-auto text-red-500"
            />

            <h2 className="text-4xl font-black mt-5">
              Daily
            </h2>

            <p className="text-gray-500 mt-3">
              Price Updates
            </p>

          </div>

        </div>
      </section>

      {/* Price Cards */}
      <section className="max-w-7xl mx-auto px-8 pb-24">

        <div className="flex justify-between items-center mb-14">

          <div>

            <h2 className="text-5xl font-black text-green-900">
              Today's Market Prices
            </h2>

            <p className="text-gray-600 mt-4 text-lg">
              Updated live mandi crop prices
            </p>

          </div>

          <button className="hidden md:flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-2xl text-lg font-semibold shadow-xl transition">

            View All

            <ArrowRight size={22} />

          </button>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-4 gap-10">

          {prices.map((item) => (

            <div
              key={item.id}
              className="group bg-white rounded-3xl overflow-hidden shadow-2xl hover:-translate-y-3 transition duration-500"
            >

              {/* Image */}
              <div className="overflow-hidden">

                <img
                  src={item.image}
                  alt={item.crop}
                  className="h-72 w-full object-cover group-hover:scale-110 transition duration-700"
                />

              </div>

              {/* Content */}
              <div className="p-6">

                <div className="flex justify-between items-center">

                  <span className="bg-green-100 text-green-700 px-4 py-1 rounded-full text-sm font-semibold">
                    {item.market}
                  </span>

                  <div
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${
                      item.trend === "up"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >

                    {item.trend === "up" ? (
                      <TrendingUp size={16} />
                    ) : (
                      <TrendingDown size={16} />
                    )}

                    {item.change}

                  </div>
                </div>

                <h3 className="text-3xl font-black mt-6">
                  {item.crop}
                </h3>

                <p className="text-green-700 text-3xl font-black mt-5">
                  {item.price}
                </p>

                <button className="w-full mt-8 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-4 rounded-2xl text-lg font-bold shadow-lg transition">

                  View Details

                </button>
              </div>
            </div>

          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-green-900 text-white py-24 px-8 text-center">

        <TrendingUp
          size={70}
          className="mx-auto text-yellow-400"
        />

        <h2 className="text-5xl font-black mt-8">
          Stay Updated With Live Prices
        </h2>

        <p className="text-green-100 text-xl mt-6 max-w-3xl mx-auto leading-9">

          Smart Krishi provides daily crop price updates,
          mandi trends and agriculture market insights
          for smarter farming decisions.

        </p>

        <button className="mt-12 bg-yellow-500 hover:bg-yellow-600 text-black px-10 py-5 rounded-2xl text-xl font-bold shadow-2xl transition">

          Get Live Updates

        </button>
      </section>
    </div>
  );
}