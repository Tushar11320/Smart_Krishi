import React from "react";
import {
  TrendingUp,
  IndianRupee,
  BarChart3,
  Wheat,
  Tractor,
  Milk,
  ArrowUpRight,
  BadgePercent,
  Activity,
} from "lucide-react";

const prices = [
  {
    id: 1,
    product: "Organic Wheat",
    market: "Bhopal Market",
    price: "₹2,450",
    growth: "+12%",
    icon: <Wheat size={34} />,
    color: "from-yellow-400 to-orange-500",
  },

  {
    id: 2,
    product: "Modern Tractor",
    market: "Indore Machinery Hub",
    price: "₹4,80,000",
    growth: "+8%",
    icon: <Tractor size={34} />,
    color: "from-green-400 to-green-600",
  },

  {
    id: 3,
    product: "Fresh Milk",
    market: "Village Dairy Market",
    price: "₹72/L",
    growth: "+5%",
    icon: <Milk size={34} />,
    color: "from-cyan-400 to-blue-600",
  },
];

const stats = [
  {
    title: "Daily Market Updates",
    value: "24/7",
    icon: <Activity size={42} />,
  },

  {
    title: "Live Price Tracking",
    value: "500+",
    icon: <BarChart3 size={42} />,
  },

  {
    title: "Best Profit Deals",
    value: "40%",
    icon: <BadgePercent size={42} />,
  },

  {
    title: "Farmers Connected",
    value: "10K+",
    icon: <TrendingUp size={42} />,
  },
];

export default function PriceEngine() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-yellow-50">

      {/* Hero Section */}
      <div className="relative h-[65vh] overflow-hidden">

        <img
          src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854"
          alt="Price Engine"
          className="absolute w-full h-full object-cover"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/60"></div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center h-full text-center text-white px-6">

          <div className="bg-white/10 backdrop-blur-lg px-6 py-3 rounded-full border border-white/20 mb-6 flex items-center gap-3">

            <TrendingUp size={28} className="text-green-300" />

            <span className="font-semibold text-lg">
              Smart Market Analytics
            </span>

          </div>

          <h1 className="text-6xl md:text-7xl font-black leading-tight">

            Smart Krishi <br />
            Price Engine

          </h1>

          <p className="max-w-3xl mt-6 text-lg text-gray-200 leading-8">

            Track live agriculture market prices,
            farming trends and smart profit opportunities
            with advanced analytics.

          </p>

          <button className="mt-10 bg-green-600 hover:bg-green-700 text-white px-10 py-5 rounded-2xl text-xl font-bold shadow-2xl flex items-center gap-3 transition">

            Explore Market

            <ArrowUpRight size={24} />

          </button>
        </div>
      </div>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-8 py-24">

        <div className="grid md:grid-cols-4 gap-8">

          {stats.map((item, index) => (

            <div
              key={index}
              className="bg-white rounded-[35px] shadow-2xl p-8 text-center hover:-translate-y-4 transition duration-500"
            >

              <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-r from-green-500 to-green-700 text-white flex items-center justify-center shadow-xl">

                {item.icon}

              </div>

              <h2 className="text-5xl font-black mt-6 text-green-900">
                {item.value}
              </h2>

              <p className="text-gray-500 text-lg mt-4">
                {item.title}
              </p>

            </div>

          ))}
        </div>
      </section>

      {/* Live Market Prices */}
      <section className="max-w-7xl mx-auto px-8 pb-24">

        <div className="text-center mb-16">

          <h2 className="text-5xl font-black text-green-900">
            Live Market Prices
          </h2>

          <p className="text-gray-600 mt-5 text-lg">
            Smart agriculture price monitoring system.
          </p>

        </div>

        <div className="grid md:grid-cols-3 gap-10">

          {prices.map((item) => (

            <div
              key={item.id}
              className="group bg-white rounded-[35px] shadow-2xl overflow-hidden hover:-translate-y-4 transition duration-500 relative"
            >

              {/* Glow */}
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-r ${item.color} transition duration-500`}></div>

              {/* Top */}
              <div className={`bg-gradient-to-r ${item.color} p-10 text-white`}>

                <div className="w-20 h-20 bg-white/20 backdrop-blur-lg rounded-3xl flex items-center justify-center shadow-2xl">

                  {item.icon}

                </div>

                <h3 className="text-3xl font-black mt-8">
                  {item.product}
                </h3>

                <p className="text-lg mt-3 opacity-90">
                  {item.market}
                </p>
              </div>

              {/* Bottom */}
              <div className="p-10">

                <div className="flex justify-between items-center">

                  <div>

                    <p className="text-gray-500 text-lg">
                      Current Price
                    </p>

                    <h2 className="text-5xl font-black text-green-800 mt-3 flex items-center gap-2">

                      <IndianRupee size={38} />

                      {item.price.replace("₹", "")}

                    </h2>

                  </div>

                  <div className="bg-green-100 text-green-700 px-5 py-3 rounded-2xl font-bold text-lg">

                    {item.growth}

                  </div>
                </div>

                {/* Button */}
                <button className="w-full mt-10 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-4 rounded-2xl text-lg font-bold shadow-xl flex items-center justify-center gap-3 transition">

                  <TrendingUp size={22} />

                  View Analytics

                </button>
              </div>
            </div>

          ))}
        </div>
      </section>

      {/* Premium Banner */}
      <section className="max-w-7xl mx-auto px-8 pb-24">

        <div className="bg-gradient-to-r from-green-700 to-green-900 rounded-[40px] overflow-hidden shadow-2xl grid md:grid-cols-2">

          {/* Left */}
          <div className="p-14 text-white flex flex-col justify-center">

            <div className="bg-white/10 backdrop-blur-lg w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl">

              <BarChart3 size={50} className="text-yellow-400" />

            </div>

            <h2 className="text-5xl font-black mt-10 leading-tight">

              Smart Farming <br />
              Price Intelligence

            </h2>

            <p className="text-green-100 text-lg mt-8 leading-9">

              Get live agriculture price trends,
              profit analytics and smart market insights
              to maximize farming income.

            </p>

            <button className="mt-10 bg-yellow-500 hover:bg-yellow-600 text-black px-10 py-5 rounded-2xl text-xl font-bold shadow-2xl transition w-fit">

              Start Tracking

            </button>
          </div>

          {/* Right */}
          <div className="relative h-[500px]">

            <img
              src="https://images.unsplash.com/photo-1464226184884-fa280b87c399"
              alt="Analytics"
              className="w-full h-full object-cover"
            />

          </div>
        </div>
      </section>
    </div>
  );
}