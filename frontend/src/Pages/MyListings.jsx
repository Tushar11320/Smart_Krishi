import React from "react";
import {
  Tractor,
  Wheat,
  MapPin,
  Milk,
  Eye,
  Edit,
  Trash2,
  Plus,
  Star,
} from "lucide-react";

const listings = [
  {
    id: 1,
    title: "Modern Tractor",
    category: "Machinery",
    price: "₹ 4,50,000",
    views: "1.2K",
    rating: "4.9",
    image:
      "https://images.unsplash.com/photo-1500937386664-56d1dfef3854",
    icon: <Tractor size={20} />,
  },

  {
    id: 2,
    title: "Organic Wheat",
    category: "Crop",
    price: "₹ 2,500",
    views: "890",
    rating: "4.8",
    image:
      "https://images.unsplash.com/photo-1464226184884-fa280b87c399",
    icon: <Wheat size={20} />,
  },

  {
    id: 3,
    title: "Premium Farming Land",
    category: "Land",
    price: "₹ 45,00,000",
    views: "2.5K",
    rating: "5.0",
    image:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
    icon: <MapPin size={20} />,
    
  },

  {
    id: 4,
    title: "Organic Milk",
    category: "Dairy",
    price: "₹ 70 / Litre",
    views: "670",
    rating: "4.7",
    image:
      "https://images.unsplash.com/photo-1563636619-e9143da7973b",
    icon: <Milk size={20} />,
  },
];

export default function MyListings() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 p-8">

      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mb-14">

        <div>

          <h1 className="text-5xl font-black text-green-900">
            My Listings
          </h1>

          <p className="text-gray-600 mt-4 text-lg">
            Manage your products, machinery and farming listings.
          </p>

        </div>

        <button className="mt-6 md:mt-0 flex items-center gap-3 bg-green-600 hover:bg-green-700 text-white px-8 py-5 rounded-2xl text-lg font-bold shadow-2xl transition">

          <Plus size={24} />

          Add New Listing

        </button>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8 mb-16">

        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center hover:-translate-y-2 transition">

          <h2 className="text-5xl font-black text-green-700">
            24
          </h2>

          <p className="text-gray-500 mt-3 text-lg">
            Active Listings
          </p>

        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center hover:-translate-y-2 transition">

          <h2 className="text-5xl font-black text-yellow-500">
            5.2K
          </h2>

          <p className="text-gray-500 mt-3 text-lg">
            Total Views
          </p>

        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center hover:-translate-y-2 transition">

          <h2 className="text-5xl font-black text-blue-500">
            18
          </h2>

          <p className="text-gray-500 mt-3 text-lg">
            Orders Received
          </p>

        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center hover:-translate-y-2 transition">

          <h2 className="text-5xl font-black text-pink-500">
            4.9
          </h2>

          <p className="text-gray-500 mt-3 text-lg">
            Seller Rating
          </p>

        </div>

      </div>

      {/* Listings Grid */}
      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-10">

        {listings.map((item) => (

          <div
            key={item.id}
            className="group bg-white rounded-3xl overflow-hidden shadow-2xl hover:-translate-y-3 transition duration-500"
          >

            {/* Image */}
            <div className="overflow-hidden">

              <img
                src={item.image}
                alt={item.title}
                className="h-72 w-full object-cover group-hover:scale-110 transition duration-700"
              />

            </div>

            {/* Content */}
            <div className="p-6">

              {/* Category */}
              <div className="flex justify-between items-center">

                <div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-1 rounded-full text-sm font-semibold">

                  {item.icon}

                  {item.category}

                </div>

                <div className="flex items-center gap-1">

                  <Star
                    size={18}
                    className="text-yellow-500 fill-yellow-500"
                  />

                  <span className="font-bold">
                    {item.rating}
                  </span>

                </div>
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold mt-6">
                {item.title}
              </h3>

              {/* Price */}
              <p className="text-green-700 text-3xl font-black mt-5">
                {item.price}
              </p>

              {/* Views */}
              <div className="flex items-center gap-2 text-gray-500 mt-5">

                <Eye size={18} />

                <span>{item.views} Views</span>

              </div>

              {/* Buttons */}
              <div className="grid grid-cols-3 gap-3 mt-8">

                <button className="bg-blue-100 hover:bg-blue-200 text-blue-700 py-3 rounded-2xl flex justify-center transition">

                  <Eye size={22} />

                </button>

                <button className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 py-3 rounded-2xl flex justify-center transition">

                  <Edit size={22} />

                </button>

                <button className="bg-red-100 hover:bg-red-200 text-red-700 py-3 rounded-2xl flex justify-center transition">

                  <Trash2 size={22} />

                </button>

              </div>
            </div>
          </div>

        ))}
      </div>

      {/* CTA */}
      <section className="max-w-7xl mx-auto mt-24 bg-green-900 rounded-[40px] text-white px-10 py-20 text-center shadow-2xl">

        <h2 className="text-5xl font-black leading-tight">
          Grow Your Agriculture Business
        </h2>

        <p className="text-green-100 text-xl mt-6 max-w-3xl mx-auto leading-9">

          Add more listings and connect with thousands
          of farmers and buyers through Smart Krishi marketplace.

        </p>

        <button className="mt-12 bg-white text-green-900 hover:bg-green-100 px-10 py-5 rounded-2xl text-xl font-bold shadow-2xl transition">

          Create New Listing

        </button>
      </section>
    </div>
  );
}