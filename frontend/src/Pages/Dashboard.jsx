import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { formatPrice } from "../services/api";
import {
  Tractor,
  CloudSun,
  Wheat,
  IndianRupee,
  Users,
  ShoppingCart,
  Bell,
  ArrowUpRight,
  TrendingUp,
  MapPin,
  Calendar,
  CloudRain,
  Wind,
  Sun,
  ArrowRight,
  ChevronRight,
  Boxes,
  FileCheck,
  PlusCircle,
  Layers,
  Store,
  Clock,
  ShieldAlert
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [sellerStats, setSellerStats] = useState(null);
  const [buyerOrders, setBuyerOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user session", e);
      }
    }
  }, []);

  const isAdmin = user && (user.roles?.includes("ADMIN") || user.roles?.includes("ROLE_ADMIN") || user.roles?.includes("SUPER_ADMIN"));
  const isSeller = user && (user.roles?.includes("SELLER") || user.roles?.includes("ROLE_SELLER"));

  // Fetch Seller stats if role matches
  useEffect(() => {
    if (isSeller && user?.id) {
      const fetchSellerDashboard = async () => {
        setLoading(true);
        try {
          const profileRes = await api.get(`/sellers/user/${user.id}`);
          const profile = profileRes.data?.data || profileRes.data;
          if (profile?.id) {
            const statsRes = await api.get(`/sellers/${profile.id}/dashboard-stats`);
            setSellerStats(statsRes.data?.data || statsRes.data);
          }
        } catch (err) {
          console.error("Failed to fetch merchant stats", err);
        } finally {
          setLoading(false);
        }
      };
      fetchSellerDashboard();
    }
  }, [isSeller, user?.id]);

  // Fetch Buyer orders if role is Buyer
  useEffect(() => {
    if (user?.id && !isSeller && !isAdmin) {
      const fetchBuyerDashboard = async () => {
        try {
          const res = await api.get(`/orders/buyer/${user.id}`);
          const content = res.data?.content || res.data?.data?.content || res.data?.data || [];
          setBuyerOrders(Array.isArray(content) ? content.slice(0, 3) : []);
        } catch (err) {
          console.error("Failed to fetch buyer orders", err);
        }
      };
      fetchBuyerDashboard();
    }
  }, [user?.id, isSeller, isAdmin]);

  // Loader state
  if (loading && isSeller) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] font-outfit">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-emerald-950 font-black text-sm">Synchronizing dashboard intelligence...</p>
      </div>
    );
  }

  // ==========================================
  // RENDER 1: ADMIN CONSOLE DASHBOARD
  // ==========================================
  if (isAdmin) {
    const stats = [
      {
        title: "Total Revenue",
        value: "₹ 2,45,000",
        change: "+14.8% vs last month",
        icon: IndianRupee,
        color: "border-emerald-100 bg-emerald-50 text-brand-green-dark"
      },
      {
        title: "Machinery Bookings",
        value: "125 Rentals",
        change: "+8.2% vs last month",
        icon: Tractor,
        color: "border-amber-100 bg-amber-50 text-amber-800"
      },
      {
        title: "Active Crop Orders",
        value: "340 Orders",
        change: "+22.1% vs last month",
        icon: Wheat,
        color: "border-emerald-100 bg-emerald-50 text-brand-green-mid"
      },
      {
        title: "Connected Farmers",
        value: "1,250 Farmers",
        change: "+5.4% new registrations",
        icon: Users,
        color: "border-blue-100 bg-blue-50 text-blue-800"
      }
    ];

    const activities = [
      { text: "New John Deere tractor booking received", time: "2 mins ago", category: "Rentals" },
      { text: "Basmati Wheat order delivered successfully", time: "1 hour ago", category: "Crops" },
      { text: "Sowing advisory warning issued: Heavy monsoon surge", time: "3 hours ago", category: "Weather" },
      { text: "Farmer 'Kishan Prasad' registered shop listing", time: "5 hours ago", category: "Market" }
    ];

    return (
      <div className="space-y-8 animate-fadeIn pb-16 font-outfit">
        {/* Header and Welcome */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-brand-green-dark">Workspace Dashboard</h1>
            <p className="text-sm text-gray-500 font-semibold mt-1">
              Welcome back, System Administrator &bull; Manage Smart Krishi operations
            </p>
          </div>
          <button className="bg-white hover:bg-gray-50 border border-gray-200 p-3.5 rounded-2xl shadow-sm transition-all relative flex items-center justify-center cursor-pointer">
            <Bell size={20} className="text-brand-green-mid" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>

        {/* Stats Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {stats.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className={`border-2 rounded-[28px] p-6 bg-white shadow-sm flex flex-col justify-between gap-4 hover:shadow-md transition-all ${item.color}`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-black uppercase tracking-wider text-gray-400">
                    {item.title}
                  </span>
                  <div className="p-2.5 bg-white rounded-xl shadow-xs border border-gray-100/60">
                    <Icon size={20} />
                  </div>
                </div>
                <div className="space-y-1">
                  <h2 className="text-3xl font-black tracking-tight text-gray-900">{item.value}</h2>
                  <span className="text-[10px] font-black uppercase text-emerald-600 block">
                    {item.change}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Interactive Charts Section (Lightweight SVG) */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Revenue Analytics Line Chart Card */}
          <div className="bg-white rounded-[32px] border border-gray-150 p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-50">
              <div>
                <h3 className="text-lg font-black text-brand-green-dark">Revenue Trend Analytics</h3>
                <p className="text-xs text-gray-400 font-bold">Monthly volume metrics (in Thousands ₹)</p>
              </div>
              <span className="flex items-center gap-1 text-xs font-black text-emerald-600">
                <TrendingUp size={14} /> +12.4%
              </span>
            </div>

            <div className="relative pt-4">
              <svg className="w-full h-56" viewBox="0 0 500 215" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#388E3C" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#388E3C" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <line x1="40" y1="30" x2="480" y2="30" stroke="#f8fafc" strokeWidth="1.5" />
                <line x1="40" y1="80" x2="480" y2="80" stroke="#f8fafc" strokeWidth="1.5" />
                <line x1="40" y1="130" x2="480" y2="130" stroke="#f8fafc" strokeWidth="1.5" />
                <line x1="40" y1="180" x2="480" y2="180" stroke="#f1f5f9" strokeWidth="1.5" />
                <path
                  d="M 40 160 L 110 130 L 180 140 L 250 80 L 320 100 L 390 60 L 480 40 L 480 180 L 40 180 Z"
                  fill="url(#chart-grad)"
                />
                <path
                  d="M 40 160 L 110 130 L 180 140 L 250 80 L 320 100 L 390 60 L 480 40"
                  fill="none"
                  stroke="#2E7D32"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="40" cy="160" r="5" fill="#FFFFFF" stroke="#2E7D32" strokeWidth="3" />
                <circle cx="110" cy="130" r="5" fill="#FFFFFF" stroke="#2E7D32" strokeWidth="3" />
                <circle cx="180" cy="140" r="5" fill="#FFFFFF" stroke="#2E7D32" strokeWidth="3" />
                <circle cx="250" cy="80" r="5" fill="#FFFFFF" stroke="#2E7D32" strokeWidth="3" />
                <circle cx="320" cy="100" r="5" fill="#FFFFFF" stroke="#2E7D32" strokeWidth="3" />
                <circle cx="390" cy="60" r="5" fill="#FFFFFF" stroke="#2E7D32" strokeWidth="3" />
                <circle cx="480" cy="40" r="5" fill="#FFFFFF" stroke="#2E7D32" strokeWidth="3" />
                
                <text x="40" y="205" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="800">JAN</text>
                <text x="110" y="205" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="800">FEB</text>
                <text x="180" y="205" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="800">MAR</text>
                <text x="250" y="205" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="800">APR</text>
                <text x="320" y="205" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="800">MAY</text>
                <text x="390" y="205" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="800">JUN</text>
                <text x="480" y="205" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="800">JUL</text>
              </svg>
            </div>
          </div>

          {/* Category Share Bar Chart Card */}
          <div className="bg-white rounded-[32px] border border-gray-150 p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-50">
              <div>
                <h3 className="text-lg font-black text-brand-green-dark">Marketplace Distribution</h3>
                <p className="text-xs text-gray-400 font-bold">Volume shares by category department</p>
              </div>
              <span className="text-xs text-gray-400 font-bold">Year 2026</span>
            </div>

            <div className="relative pt-6">
              <svg className="w-full h-56" viewBox="0 0 500 215" preserveAspectRatio="none">
                <line x1="40" y1="40" x2="480" y2="40" stroke="#f8fafc" strokeWidth="1.5" />
                <line x1="40" y1="100" x2="480" y2="100" stroke="#f8fafc" strokeWidth="1.5" />
                <line x1="40" y1="160" x2="480" y2="160" stroke="#f1f5f9" strokeWidth="1.5" />
                <rect x="70" y="40" width="36" height="120" rx="6" fill="#2E7D32" />
                <rect x="150" y="90" width="36" height="70" rx="6" fill="#0284C7" />
                <rect x="230" y="60" width="36" height="100" rx="6" fill="#F4C430" />
                <rect x="310" y="50" width="36" height="110" rx="6" fill="#8B5A2B" />
                <rect x="390" y="110" width="36" height="50" rx="6" fill="#10B981" />
                
                <text x="88" y="195" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="800">Crops</text>
                <text x="168" y="195" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="800">Milk</text>
                <text x="248" y="195" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="800">Machinery</text>
                <text x="328" y="195" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="800">Fertilizer</text>
                <text x="408" y="195" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="800">Land</text>
              </svg>
            </div>
          </div>
        </div>

        {/* Weather advisory and recent activities */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Weather Advisory */}
          <div className="bg-white rounded-[32px] border border-gray-150 p-6 shadow-sm space-y-6 flex flex-col justify-between">
            <div className="flex justify-between items-center pb-2 border-b border-gray-50">
              <h3 className="text-lg font-black text-brand-green-dark">Agronomic Weather</h3>
              <CloudSun className="text-wheat-gold animate-bounce" size={24} />
            </div>
            <div className="space-y-4">
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-black text-brand-green-dark tracking-tight">32°C</span>
                <span className="text-xs text-gray-400 font-bold block">Partly Sunny &bull; Bhopal</span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-2">
                  <CloudRain className="text-blue-500" size={16} />
                  <div>
                    <span className="text-[10px] text-gray-400 block font-bold">HUMIDITY</span>
                    <strong className="text-sm font-extrabold text-gray-700">65%</strong>
                  </div>
                </div>
                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-2">
                  <Wind className="text-emerald-500" size={16} />
                  <div>
                    <span className="text-[10px] text-gray-400 block font-bold">WIND</span>
                    <strong className="text-sm font-extrabold text-gray-700">12 km/h</strong>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-emerald-50 text-brand-green-dark border border-emerald-100 p-4 rounded-2xl text-xs font-semibold leading-relaxed">
              🌿 <strong>Soil Advisory</strong>: Good seed-drilling soil profile moisture detected in central districts. Apply nitrogen dressing only after Friday rain surge.
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-white rounded-[32px] border border-gray-150 p-6 shadow-sm space-y-4 lg:col-span-2">
            <div className="flex justify-between items-center pb-2 border-b border-gray-50">
              <h3 className="text-lg font-black text-brand-green-dark">Operations Log</h3>
              <span className="text-xs bg-gray-100 px-3 py-1 rounded-full font-bold text-gray-500">Live Stream</span>
            </div>
            <div className="space-y-3.5">
              {activities.map((act, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-gray-100/50 transition duration-150"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 bg-brand-green-mid rounded-full shrink-0"></div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{act.text}</p>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{act.category}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400 font-extrabold shrink-0 pl-2">{act.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER 2: SELLER DASHBOARD VIEW
  // ==========================================
  if (isSeller) {
    const stats = [
      {
        title: "Store Earnings",
        value: formatPrice(sellerStats?.totalRevenue || 0),
        change: "Total sales generated",
        icon: IndianRupee,
        color: "border-amber-100 bg-amber-50 text-amber-800"
      },
      {
        title: "Active Listings",
        value: `${sellerStats?.totalProducts || 0} items`,
        change: "In catalog",
        icon: Boxes,
        color: "border-emerald-100 bg-emerald-50 text-emerald-800"
      },
      {
        title: "Orders Received",
        value: `${sellerStats?.totalOrders || 0} orders`,
        change: `${sellerStats?.pendingOrdersCount || 0} awaiting dispatch`,
        icon: FileCheck,
        color: "border-sky-100 bg-sky-50 text-sky-800"
      },
      {
        title: "Successful Delivery Rate",
        value: "98.5%",
        change: "Platform benchmark standard",
        icon: Users,
        color: "border-green-100 bg-green-50 text-green-800"
      }
    ];

    return (
      <div className="space-y-8 animate-fadeIn pb-16 font-outfit">
        {/* Header and Welcome */}
        <div className="flex justify-between items-center border-b border-gray-100 pb-5">
          <div>
            <h1 className="text-3xl font-black text-emerald-950">Merchant Center Dashboard</h1>
            <p className="text-sm text-gray-500 font-semibold mt-1">
              Store Owner Workspace &bull; Empowering Indian Agriculture Marketplace
            </p>
          </div>
          <Link
            to="/seller/shop"
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-5 py-3 rounded-2xl shadow transition"
          >
            <Store size={18} /> View My Shop
          </Link>
        </div>

        {/* Stats Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {stats.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className={`border-2 rounded-[28px] p-6 bg-white shadow-sm flex flex-col justify-between gap-4 hover:shadow-md transition-all ${item.color}`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-black uppercase tracking-wider text-gray-400">
                    {item.title}
                  </span>
                  <div className="p-2.5 bg-white rounded-xl shadow-xs border border-gray-100/60">
                    <Icon size={20} />
                  </div>
                </div>
                <div className="space-y-1">
                  <h2 className="text-3xl font-black tracking-tight text-gray-900">{item.value}</h2>
                  <span className="text-[10px] font-black uppercase text-emerald-600 block">
                    {item.change}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Middle Section: Quick Actions & Sales Trends */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Sales Chart (Lightweight SVG) */}
          <div className="lg:col-span-2 bg-white rounded-[32px] border border-gray-150 p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-black text-emerald-950">Annual Shop Earnings Trend</h3>
            <p className="text-xs text-gray-400 font-bold">Monthly revenue projections (₹ in thousands)</p>

            <div className="relative pt-6">
              <svg className="w-full h-56" viewBox="0 0 500 215" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="seller-chart-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d97706" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#d97706" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <line x1="40" y1="40" x2="480" y2="40" stroke="#f8fafc" strokeWidth="1.5" />
                <line x1="40" y1="100" x2="480" y2="100" stroke="#f8fafc" strokeWidth="1.5" />
                <line x1="40" y1="160" x2="480" y2="160" stroke="#f1f5f9" strokeWidth="1.5" />
                
                {/* SVG Path representing monthly values */}
                <path
                  d="M 40 160 Q 150 120 250 80 T 480 30 L 480 160 Z"
                  fill="url(#seller-chart-grad)"
                />
                <path
                  d="M 40 160 Q 150 120 250 80 T 480 30"
                  fill="none"
                  stroke="#d97706"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <circle cx="250" cy="80" r="6" fill="#ffffff" stroke="#d97706" strokeWidth="3.5" />
                <circle cx="480" cy="30" r="6" fill="#ffffff" stroke="#d97706" strokeWidth="3.5" />
                
                <text x="60" y="195" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="800">JAN-MAR</text>
                <text x="190" y="195" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="800">APR-JUN</text>
                <text x="320" y="195" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="800">JUL-SEP</text>
                <text x="450" y="195" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="800">OCT-DEC</text>
              </svg>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-white rounded-[32px] border border-gray-150 p-6 shadow-sm space-y-4 flex flex-col justify-between">
            <h3 className="text-lg font-black text-emerald-950 pb-2 border-b border-gray-50">Merchant Tools</h3>
            
            <div className="space-y-3">
              <Link
                to="/seller/add-product"
                className="flex items-center justify-between p-4 bg-gray-50 hover:bg-emerald-50 text-emerald-950 rounded-2xl border border-gray-100 transition group"
              >
                <div className="flex items-center gap-3">
                  <PlusCircle size={20} className="text-emerald-600" />
                  <span className="font-bold text-sm">Add New Product</span>
                </div>
                <ChevronRight size={16} className="text-gray-400 group-hover:translate-x-1 transition" />
              </Link>

              <Link
                to="/seller/listings"
                className="flex items-center justify-between p-4 bg-gray-50 hover:bg-emerald-50 text-emerald-950 rounded-2xl border border-gray-100 transition group"
              >
                <div className="flex items-center gap-3">
                  <Layers size={20} className="text-emerald-600" />
                  <span className="font-bold text-sm">My Store Listings</span>
                </div>
                <ChevronRight size={16} className="text-gray-400 group-hover:translate-x-1 transition" />
              </Link>

              <Link
                to="/seller/inventory"
                className="flex items-center justify-between p-4 bg-gray-50 hover:bg-emerald-50 text-emerald-950 rounded-2xl border border-gray-100 transition group"
              >
                <div className="flex items-center gap-3">
                  <Boxes size={20} className="text-emerald-600" />
                  <span className="font-bold text-sm">Stock & Inventory</span>
                </div>
                <ChevronRight size={16} className="text-gray-400 group-hover:translate-x-1 transition" />
              </Link>

              <Link
                to="/seller/orders"
                className="flex items-center justify-between p-4 bg-gray-50 hover:bg-emerald-50 text-emerald-950 rounded-2xl border border-gray-100 transition group"
              >
                <div className="flex items-center gap-3">
                  <FileCheck size={20} className="text-emerald-600" />
                  <span className="font-bold text-sm">Orders Received</span>
                </div>
                <ChevronRight size={16} className="text-gray-400 group-hover:translate-x-1 transition" />
              </Link>
            </div>
            
            <div className="bg-amber-50 text-amber-800 border border-amber-100 p-4.5 rounded-2xl text-xs font-semibold leading-relaxed">
              🔔 <strong>Merchant Notice</strong>: Order fulfillment shipping timelines must comply with the 24-hour dispatch rule. Prompt updates build high farmer-rating indexes.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER 3: BUYER / STANDARD DASHBOARD VIEW
  // ==========================================
  const slogans = [
    "Digital Bharat, Smart Kisan 🌾",
    "Technology for Prosperous Farming 🚜",
    "Jai Jawan Jai Kisan 🇮🇳"
  ];
  const activeSlogan = slogans[new Date().getDay() % slogans.length];

  return (
    <div className="space-y-8 animate-fadeIn pb-16 font-outfit">
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-green-900 via-emerald-800 to-[#043e1d] rounded-[36px] p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.15),transparent)]"></div>
        <div className="relative z-10 space-y-4 max-w-xl">
          <span className="bg-emerald-600/30 border border-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full">
            {activeSlogan}
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
            Empowering Farmers.<br />Connecting Markets.
          </h1>
          <p className="text-sm text-green-100/80 font-medium">
            Welcome, {user?.firstName || "Farmer"}! Check daily mandi prices, view regional weather advisories, or manage your active orders.
          </p>
          <div className="flex gap-3 pt-2">
            <Link
              to="/farming-crop"
              className="bg-white hover:bg-green-50 text-green-950 font-black text-xs px-5 py-3 rounded-2xl shadow transition flex items-center gap-1.5"
            >
              Crops Marketplace <ArrowRight size={14} />
            </Link>
            <Link
              to="/weather"
              className="bg-emerald-700/50 hover:bg-emerald-700/70 border border-emerald-600/30 text-white font-bold text-xs px-5 py-3 rounded-2xl transition"
            >
              Weather Forecast
            </Link>
          </div>
        </div>
        {/* Wheat logo overlay back decoration */}
        <div className="absolute right-8 bottom-0 opacity-10 pointer-events-none transform translate-y-6">
          <Wheat size={240} className="text-white" />
        </div>
      </div>

      {/* Grid: Marketplace Categories & Weather widget */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Quick Marketplace Category shortcuts */}
        <div className="lg:col-span-2 bg-white rounded-[32px] border border-gray-150 p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center pb-2 border-b border-gray-50">
            <h3 className="text-lg font-black text-brand-green-dark">Marketplace Catalog</h3>
            <span className="text-xs text-gray-400 font-bold">Quick Shortcuts</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            <Link
              to="/farming-crop"
              className="flex flex-col items-center justify-center p-5 bg-emerald-50/50 hover:bg-emerald-50 text-center rounded-3xl border border-emerald-100/40 transition-all hover:scale-102"
            >
              <div className="p-3 bg-emerald-100 text-emerald-800 rounded-2xl mb-3">
                <Wheat size={20} />
              </div>
              <span className="text-xs font-black text-emerald-950">Crops Market</span>
            </Link>

            <Link
              to="/milk"
              className="flex flex-col items-center justify-center p-5 bg-sky-50/50 hover:bg-sky-50 text-center rounded-3xl border border-sky-100/40 transition-all hover:scale-102"
            >
              <div className="p-3 bg-sky-100 text-sky-800 rounded-2xl mb-3">
                <Sun size={20} />
              </div>
              <span className="text-xs font-black text-sky-950">Milk Market</span>
            </Link>

            <Link
              to="/machinery"
              className="flex flex-col items-center justify-center p-5 bg-amber-50/50 hover:bg-amber-50 text-center rounded-3xl border border-amber-100/40 transition-all hover:scale-102"
            >
              <div className="p-3 bg-amber-100 text-amber-800 rounded-2xl mb-3">
                <Tractor size={20} />
              </div>
              <span className="text-xs font-black text-amber-950">Machinery Buy</span>
            </Link>

            <Link
              to="/machinery-rental"
              className="flex flex-col items-center justify-center p-5 bg-blue-50/50 hover:bg-blue-50 text-center rounded-3xl border border-blue-100/40 transition-all hover:scale-102"
            >
              <div className="p-3 bg-blue-100 text-blue-800 rounded-2xl mb-3">
                <Tractor size={20} />
              </div>
              <span className="text-xs font-black text-blue-950">Machinery Rent</span>
            </Link>

            <Link
              to="/fertilizers"
              className="flex flex-col items-center justify-center p-5 bg-orange-50/50 hover:bg-orange-50 text-center rounded-3xl border border-orange-100/40 transition-all hover:scale-102"
            >
              <div className="p-3 bg-orange-100 text-orange-800 rounded-2xl mb-3">
                <Boxes size={20} />
              </div>
              <span className="text-xs font-black text-orange-950">Fertilizers</span>
            </Link>
          </div>

          {/* Quick link banner */}
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4.5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <ShoppingCart size={18} className="text-emerald-700" />
              <div className="text-xs">
                <p className="font-extrabold text-gray-800">Shopping Cart Status</p>
                <p className="text-gray-400 font-bold mt-0.5">Review items currently in your buyer center cart.</p>
              </div>
            </div>
            <Link
              to="/cart"
              className="text-xs font-black text-emerald-700 hover:underline flex items-center gap-1 shrink-0"
            >
              Open Cart <ChevronRight size={14} />
            </Link>
          </div>
        </div>

        {/* Agronomic Weather Widget */}
        <div className="bg-white rounded-[32px] border border-gray-150 p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div className="flex justify-between items-center pb-2 border-b border-gray-50">
            <h3 className="text-lg font-black text-emerald-950">Agronomic Weather</h3>
            <CloudSun className="text-wheat-gold animate-bounce" size={24} />
          </div>

          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-black text-emerald-950 tracking-tight">32°C</span>
              <span className="text-xs text-gray-400 font-bold block">Partly Sunny &bull; Bhopal</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-2">
                <CloudRain className="text-blue-500" size={16} />
                <div>
                  <span className="text-[9px] text-gray-400 block font-bold">HUMIDITY</span>
                  <strong className="text-xs font-extrabold text-gray-700">65%</strong>
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-2">
                <Wind className="text-emerald-500" size={16} />
                <div>
                  <span className="text-[9px] text-gray-400 block font-bold">WIND</span>
                  <strong className="text-xs font-extrabold text-gray-700">12 km/h</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 text-emerald-900 border border-emerald-100 p-4 rounded-2xl text-xs font-semibold leading-relaxed">
            🌾 <strong>Weekly Advisory</strong>: Moderate rainfall predicted in central district crop zones. Ensure adequate drainage in seedling blocks.
          </div>
        </div>

      </div>

      {/* Recent Orders Log for Buyer */}
      <div className="bg-white rounded-[32px] border border-gray-150 p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-gray-50">
          <h3 className="text-lg font-black text-brand-green-dark">My Active Orders</h3>
          <Link to="/buyer/orders" className="text-xs text-emerald-700 hover:underline font-bold">
            All Order History &rarr;
          </Link>
        </div>

        {buyerOrders.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <p className="text-xs text-gray-400 font-bold">No active orders placed recently.</p>
            <Link to="/farming-crop" className="mt-2 text-xs text-emerald-700 font-black inline-block hover:underline">
              Browse Crops Marketplace
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {buyerOrders.map((ord) => (
              <div
                key={ord.id}
                className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-gray-50 rounded-2xl border border-gray-100 gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-emerald-950">{ord.orderNumber}</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-black uppercase">
                      {ord.orderStatus}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 font-bold">Shipping Address: {ord.shippingAddress}</p>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto justify-between shrink-0">
                  <strong className="text-sm text-emerald-900 font-extrabold">{formatPrice(ord.totalAmount)}</strong>
                  <Link
                    to={`/orders/${ord.id}/track`}
                    className="bg-white hover:bg-gray-50 border border-gray-250 text-emerald-950 font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition"
                  >
                    Track Order
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}