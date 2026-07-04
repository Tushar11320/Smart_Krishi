import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Leaf,
  Wheat,
  Milk,
  Tractor,
  Boxes,
  Hammer,
  MapPin,
  CloudSun,
  Star,
  ShieldCheck,
  ArrowRight,
  Calendar,
  Users,
  Handshake,
  UserCheck,
  Coins,
  Headphones,
  Thermometer,
  Droplet,
  Wind,
  CloudRain,
  Sunrise,
  Sunset
} from "lucide-react";
import farmerHeroImg from "../assets/farmer_hero.png";

// Helper to format currency
const formatPrice = (price) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(price);
};

export default function Home() {
  const navigate = useNavigate();

  const categories = [
    {
      title: "Crops Marketplace",
      desc: "Sell fresh yields directly or buy high-grade grains.",
      icon: Wheat,
      path: "/farming-crop",
      color: "border-emerald-100 hover:border-emerald-350 text-emerald-800 bg-emerald-50/20",
      badge: "Verified Yields"
    },
    {
      title: "Milk Marketplace",
      desc: "Direct daily procurement from local dairy farmers.",
      icon: Milk,
      path: "/milk",
      color: "border-sky-100 hover:border-sky-350 text-sky-850 bg-sky-50/20",
      badge: "Pure & Fresh"
    },
    {
      title: "Machinery Rentals",
      desc: "Rent premium tractors, tillers, and harvesters nearby.",
      icon: Tractor,
      path: "/machinery-rental",
      color: "border-amber-100 hover:border-amber-350 text-amber-800 bg-amber-50/20",
      badge: "Local Providers"
    },
    {
      title: "Fertilizers & Seed",
      desc: "Certified organic fertilizers and yield-boosting inputs.",
      icon: Boxes,
      path: "/fertilizers",
      color: "border-teal-100 hover:border-teal-350 text-teal-850 bg-teal-50/20",
      badge: "Govt Certified"
    },
    {
      title: "Building Materials",
      desc: "Cement, brick, and fencing supplies for farm structures.",
      icon: Hammer,
      path: "/building-materials",
      color: "border-stone-150 hover:border-stone-350 text-stone-800 bg-stone-50/20",
      badge: "Bulk Rates"
    },
    {
      title: "Land Marketplace",
      desc: "List or purchase agricultural plots with verified titles.",
      icon: MapPin,
      path: "/landselling",
      color: "border-orange-100 hover:border-orange-350 text-orange-800 bg-orange-50/20",
      badge: "Verified Titles"
    },
    {
      title: "Weather Intelligence",
      desc: "Hour-by-hour advisories and sowing weather window alerts.",
      icon: CloudSun,
      path: "/weather",
      color: "border-blue-100 hover:border-blue-350 text-blue-800 bg-blue-50/20",
      badge: "Sowing Forecast"
    }
  ];

  const stats = [
    {
      icon: Users,
      value: "50K+",
      label: "Active Farmers",
      desc: "Growing every day",
      color: "text-emerald-700 bg-emerald-50"
    },
    {
      icon: Handshake,
      value: "12K+",
      label: "Trade Listings",
      desc: "Across all categories",
      color: "text-emerald-700 bg-emerald-50"
    },
    {
      icon: ShieldCheck,
      value: "100%",
      label: "Verified Users",
      desc: "Trusted & secured",
      color: "text-emerald-700 bg-emerald-50"
    },
    {
      icon: Star,
      value: "4.8/5",
      label: "Farmer Rating",
      desc: "From 8K+ reviews",
      color: "text-amber-500 bg-amber-50"
    },
    {
      icon: Coins,
      value: "₹250Cr+",
      label: "Trade Value",
      desc: "Total platform value",
      color: "text-emerald-700 bg-emerald-50"
    },
    {
      icon: Headphones,
      value: "24/7",
      label: "Farmer Support",
      desc: "We're always here",
      color: "text-purple-700 bg-purple-50"
    }
  ];

  return (
    <div className="w-full min-h-screen bg-[#F8F9FA] pb-16 font-outfit p-6 md:p-8 space-y-8 text-left">
      
      {/* Hero section: Grid with Main Welcome card + Weather Live card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Hero Card - 7 Cols */}
        <div className="lg:col-span-7 bg-white border border-gray-150 rounded-[32px] p-8 shadow-sm flex flex-col justify-between gap-6 relative overflow-hidden">
          <div className="space-y-4 max-w-xl z-10">
            {/* Tag Badge */}
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-black uppercase tracking-wider">
              <Leaf size={12} className="fill-emerald-800/10 text-emerald-800 shrink-0" />
              Empowering Farmers. Connecting Markets.
            </span>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-5xl font-black text-gray-900 leading-tight">
              Digital Bharat, <br />
              <span className="text-emerald-750 font-black">Smart Kisan</span> <span className="font-black text-gray-900">IN</span>
            </h1>

            {/* Description */}
            <p className="text-gray-500 text-sm font-semibold leading-relaxed">
              Smart Krishi brings technology straight to the soil. Trade grains directly, rent tractors, buy seeds, consult agronomists, and access live market indices. Designed for farmers, trusted by businesses.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 z-10">
            <button
              onClick={() => navigate("/farming-crop")}
              className="px-6 py-3.5 bg-[#0f5132] hover:bg-[#0c4128] text-white font-extrabold text-xs rounded-xl shadow transition duration-200 cursor-pointer flex items-center gap-1.5"
            >
              Explore Products <ArrowRight size={14} />
            </button>
            <button
              onClick={() => navigate("/account")}
              className="px-6 py-3.5 border-2 border-emerald-800 text-emerald-800 hover:bg-emerald-50/50 font-extrabold text-xs rounded-xl transition duration-200 cursor-pointer"
            >
              Register Shop / Sell
            </button>
          </div>

          {/* Farmer Hero Graphic superimposed on the right corner */}
          <div className="absolute right-0 bottom-0 top-0 w-1/2 hidden md:block select-none pointer-events-none">
            <img
              src={farmerHeroImg}
              alt=""
              className="w-full h-full object-contain object-bottom transform translate-y-1 translate-x-2"
            />
          </div>
        </div>

        {/* Right Weather live Widget - 5 Cols */}
        <div className="lg:col-span-5 bg-gradient-to-tr from-[#0c3a25] to-[#08291a] text-white rounded-[32px] p-6 shadow-md flex flex-col justify-between gap-6 relative overflow-hidden">
          
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[9px] tracking-wider uppercase font-black bg-white/10 text-green-200 px-2.5 py-1 rounded-full border border-white/5">
                Live Advisory Widget
              </span>
              <h3 className="text-lg font-bold pt-2">Weather Intelligence</h3>
              <p className="text-xs text-green-200">Central India Region &bull; Bhopal</p>
            </div>
            <CloudSun size={32} className="text-amber-400 animate-bounce-slow" />
          </div>

          {/* Forecast body and secondary details */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            
            {/* Primary Details (Left 7 Cols on desktop) */}
            <div className="md:col-span-7 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-5xl font-black tracking-tighter">32°C</span>
                <div className="flex flex-col justify-center">
                  <span className="text-[10px] text-green-300 font-extrabold uppercase tracking-wider">Sunny Outlook</span>
                  <span className="text-xs text-white/90 font-bold">Optimal Planting Window Open</span>
                </div>
              </div>
              
              <p className="text-xs text-green-100/80 font-medium leading-relaxed">
                Optimal planting window is OPEN. Humidity at 65% with calm wind. Next precipitation projection: Friday.
              </p>
              
              <div className="flex items-center justify-between border-t border-white/10 pt-3">
                <span className="text-xs text-green-300 font-black">Sowing Alert Index: Good</span>
                <button
                  onClick={() => navigate("/weather")}
                  className="text-[10px] font-black bg-white text-green-950 px-3.5 py-2 rounded-lg shadow-sm hover:bg-gray-100 transition flex items-center gap-1 shrink-0"
                >
                  Full Weather Forecast <ArrowRight size={10} />
                </button>
              </div>
            </div>

            {/* Secondary Stats (Right 5 Cols on desktop) */}
            <div className="md:col-span-5 bg-white/5 border border-white/5 p-3 rounded-2xl space-y-2 text-[10px] font-bold">
              <div className="flex justify-between items-center text-white/95">
                <span className="flex items-center gap-1 text-white/60"><Thermometer size={12} /> Feels Like</span>
                <span className="font-mono">36°C</span>
              </div>
              <div className="flex justify-between items-center text-white/95">
                <span className="flex items-center gap-1 text-white/60"><Droplet size={12} /> Humidity</span>
                <span className="font-mono">65%</span>
              </div>
              <div className="flex justify-between items-center text-white/95">
                <span className="flex items-center gap-1 text-white/60"><Wind size={12} /> Wind Speed</span>
                <span className="font-mono">12 km/h</span>
              </div>
              <div className="flex justify-between items-center text-white/95">
                <span className="flex items-center gap-1 text-white/60"><CloudRain size={12} /> Rain Chance</span>
                <span className="font-mono">10%</span>
              </div>
              <div className="flex justify-between items-center text-white/95 border-t border-white/5 pt-1.5 mt-1.5">
                <span className="flex items-center gap-1 text-white/60"><Sunrise size={12} /> Sunrise</span>
                <span className="font-mono">05:48 AM</span>
              </div>
              <div className="flex justify-between items-center text-white/95">
                <span className="flex items-center gap-1 text-white/60"><Sunset size={12} /> Sunset</span>
                <span className="font-mono">06:32 PM</span>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Sowing Season strip */}
      <div className="bg-[#EAF5EF] border border-emerald-100 rounded-3xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-600/10 text-emerald-800 rounded-xl">
            <Calendar size={20} className="text-emerald-850" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-emerald-950">Kharif Season 2024</h4>
            <p className="text-xs text-emerald-900/60 font-semibold mt-0.5">Best time for rice, maize, cotton & soybean sowing.</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/weather")}
          className="px-5 py-2.5 bg-white border border-emerald-150 text-emerald-800 font-extrabold text-xs rounded-xl shadow-sm hover:bg-emerald-50/50 transition cursor-pointer"
        >
          View Calendar
        </button>
      </div>

      {/* Marketplace Hubs Categories */}
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl md:text-3xl font-black text-gray-900">Marketplace Hubs</h2>
          <p className="text-[10px] md:text-xs text-gray-400 font-black uppercase tracking-widest">Tap a category below to explore certified trade entries</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <div
                key={i}
                onClick={() => navigate(cat.path)}
                className={`p-6 bg-white rounded-[28px] border-2 flex flex-col justify-between gap-4 cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group ${cat.color}`}
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
                      <Icon size={22} className="group-hover:scale-110 transition duration-300" />
                    </div>
                    <span className="text-[9px] font-black tracking-wider uppercase bg-white px-2.5 py-0.5 rounded-full border border-gray-100">
                      {cat.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-gray-900">{cat.title}</h3>
                  <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                    {cat.desc}
                  </p>
                </div>
                
                <span className="text-xs font-black flex items-center gap-1 mt-2 text-emerald-800 group-hover:gap-2 transition-all">
                  Open Marketplace <ArrowRight size={12} />
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="bg-white border border-gray-150 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-sm"
            >
              <div className="p-2.5 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-50 text-[#0f5132]">
                <Icon size={20} />
              </div>
              <div>
                <h4 className="text-xl font-black text-gray-900">{stat.value}</h4>
                <p className="text-[11px] font-extrabold text-gray-800 mt-0.5">{stat.label}</p>
                <p className="text-[9px] text-gray-400 font-bold mt-0.5">{stat.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}