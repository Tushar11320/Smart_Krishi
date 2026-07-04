import React from "react";
import {
  BadgePercent,
  ShoppingCart,
  Star,
  Tractor,
  Wheat,
  Milk,
  Hammer,
  ArrowRight,
} from "lucide-react";

const deals = [
  {
    id: 1,
    title: "Modern Tractor",
    category: "Machinery",
    price: "₹4,50,000",
    oldPrice: "₹5,20,000",
    discount: "20% OFF",
    image:
      "https://images.unsplash.com/photo-1500937386664-56d1dfef3854",
    icon: <Tractor size={24} />,
  },

  {
    id: 2,
    title: "Organic Wheat",
    category: "Crops",
    price: "₹2,500",
    oldPrice: "₹3,000",
    discount: "15% OFF",
    image:
      "https://images.unsplash.com/photo-1464226184884-fa280b87c399",
    icon: <Wheat size={24} />,
  },

  {
    id: 3,
    title: "Fresh Organic Milk",
    category: "Dairy",
    price: "₹70",
    oldPrice: "₹100",
    discount: "30% OFF",
    image:
      "https://images.unsplash.com/photo-1560493676-04071c5f467b",
    icon: <Milk size={24} />,
  },

  {
    id: 4,
    title: "Building Materials",
    category: "Construction",
    price: "₹15,000",
    oldPrice: "₹20,000",
    discount: "25% OFF",
    image:
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd",
    icon: <Hammer size={24} />,
  },
];

export default function TopDeals() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-yellow-50">

      {/* Hero Section */}
      <div className="relative h-[65vh] overflow-hidden">

        <img
          src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854"
          alt="Top Deals"
          className="absolute w-full h-full object-cover"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/60"></div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center h-full text-center text-white px-6">

          <div className="bg-yellow-400/20 backdrop-blur-lg px-6 py-3 rounded-full border border-yellow-300/30 mb-6 flex items-center gap-3">

            <BadgePercent size={28} className="text-yellow-300" />

            <span className="font-semibold text-lg">
              Best Agriculture Offers
            </span>

          </div>

          <h1 className="text-6xl md:text-7xl font-black leading-tight">

            Smart Krishi <br />
            Top Deals

          </h1>

          <p className="max-w-3xl mt-6 text-lg text-gray-200 leading-8">

            Discover premium farming products, machinery,
            crops and dairy items with amazing discounts.

          </p>

          <button className="mt-10 bg-yellow-500 hover:bg-yellow-600 text-black px-10 py-5 rounded-2xl text-xl font-bold shadow-2xl flex items-center gap-3 transition">

            Explore Deals

            <ArrowRight size={24} />

          </button>
        </div>
      </div>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-8 py-20">

        <div className="grid md:grid-cols-4 gap-8">

          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center hover:-translate-y-3 transition">

            <BadgePercent
              size={50}
              className="mx-auto text-yellow-500"
            />

            <h2 className="text-5xl font-black mt-5">
              50%
            </h2>

            <p className="text-gray-500 mt-3 text-lg">
              Maximum Discount
            </p>

          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center hover:-translate-y-3 transition">

            <ShoppingCart
              size={50}
              className="mx-auto text-green-600"
            />

            <h2 className="text-5xl font-black mt-5">
              10K+
            </h2>

            <p className="text-gray-500 mt-3 text-lg">
              Products Sold
            </p>

          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center hover:-translate-y-3 transition">

            <Star
              size={50}
              className="mx-auto text-pink-500"
            />

            <h2 className="text-5xl font-black mt-5">
              4.9
            </h2>

            <p className="text-gray-500 mt-3 text-lg">
              Customer Rating
            </p>

          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center hover:-translate-y-3 transition">

            <Tractor
              size={50}
              className="mx-auto text-blue-500"
            />

            <h2 className="text-5xl font-black mt-5">
              500+
            </h2>

            <p className="text-gray-500 mt-3 text-lg">
              Farming Products
            </p>

          </div>

        </div>
      </section>

      {/* Deals Section */}
      <section className="max-w-7xl mx-auto px-8 pb-24">

        <div className="flex justify-between items-center mb-14">

          <div>

            <h2 className="text-5xl font-black text-green-900">
              Trending Deals
            </h2>

            <p className="text-gray-600 mt-4 text-lg">
              Best prices for smart farmers.
            </p>

          </div>

          <button className="hidden md:flex bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-2xl text-lg font-bold shadow-xl transition">

            View All Deals

          </button>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-4 gap-10">

          {deals.map((deal) => (

            <div
              key={deal.id}
              className="group bg-white rounded-[35px] overflow-hidden shadow-2xl hover:-translate-y-4 transition duration-500"
            >

              {/* Image */}
              <div className="overflow-hidden relative">

                <img
                  src={deal.image}
                  alt={deal.title}
                  className="h-72 w-full object-cover group-hover:scale-110 transition duration-700"
                />

                {/* Discount */}
                <div className="absolute top-5 left-5 bg-red-500 text-white px-4 py-2 rounded-full font-bold shadow-lg">

                  {deal.discount}

                </div>
              </div>

              {/* Content */}
              <div className="p-7">

                {/* Category */}
                <div className="flex items-center gap-3 text-green-700 font-semibold">

                  {deal.icon}

                  <span>{deal.category}</span>

                </div>

                {/* Title */}
                <h3 className="text-3xl font-black mt-5">
                  {deal.title}
                </h3>

                {/* Prices */}
                <div className="mt-6">

                  <p className="text-3xl font-black text-green-700">
                    {deal.price}
                  </p>

                  <p className="text-gray-400 line-through text-lg mt-2">
                    {deal.oldPrice}
                  </p>

                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 mt-5">

                  <Star
                    size={20}
                    className="text-yellow-500 fill-yellow-500"
                  />

                  <span className="font-semibold">
                    4.9 Ratings
                  </span>

                </div>

                {/* Button */}
                <button className="w-full mt-8 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-4 rounded-2xl text-lg font-bold shadow-lg flex items-center justify-center gap-3 transition">

                  <ShoppingCart size={22} />

                  Add To Cart

                </button>
              </div>
            </div>

          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-green-900 text-white py-24 px-8 text-center">

        <BadgePercent
          size={70}
          className="mx-auto text-yellow-400"
        />

        <h2 className="text-5xl font-black mt-8">
          Save More With Smart Krishi
        </h2>

        <p className="text-green-100 text-xl mt-6 max-w-3xl mx-auto leading-9">

          Explore agriculture products, machinery,
          crops and smart farming tools with premium
          discounts and trusted quality.

        </p>

        <button className="mt-12 bg-yellow-500 hover:bg-yellow-600 text-black px-10 py-5 rounded-2xl text-xl font-bold shadow-2xl transition">

          Start Shopping

        </button>
      </section>
    </div>
  );
}