import React, { useState, useEffect } from "react";
import api, { formatPrice } from "../services/api";
import {
  IndianRupee,
  FileText,
  TrendingUp,
  Users,
  Eye,
  ShoppingBag,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Info,
  Calendar,
  Layers,
  ArrowUpRight,
  PackageCheck,
  Star,
  MessageCircle
} from "lucide-react";

export default function SellerAnalyticsDashboard({ sellerProfile }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Toggles for chart view
  const [chartDimension, setChartDimension] = useState("DAILY"); // DAILY, WEEKLY, MONTHLY, YEARLY
  const [chartMetric, setChartMetric] = useState("REVENUE"); // REVENUE, ORDERS
  
  // Interactive tooltip state
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/seller/analytics");
      setAnalytics(response.data?.data || response.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load seller analytics. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-[32px] p-12 border border-green-50 shadow-xl text-center space-y-4">
        <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-gray-500 font-bold text-sm">Compiling seller intelligence dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-[32px] p-8 border border-red-100 shadow-xl text-center space-y-4">
        <AlertCircle className="text-red-500 mx-auto" size={48} />
        <h3 className="text-xl font-black text-red-950">Analytics Error</h3>
        <p className="text-gray-500 text-sm">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  // Active chart data selection
  const getActiveChartData = () => {
    if (!analytics) return [];
    switch (chartDimension) {
      case "DAILY":
        return analytics.dailyChart || [];
      case "WEEKLY":
        return analytics.weeklyChart || [];
      case "MONTHLY":
        return analytics.monthlyChart || [];
      case "YEARLY":
        return analytics.yearlyChart || [];
      default:
        return [];
    }
  };

  const chartData = getActiveChartData();

  // Rendering logic for Custom SVG Chart
  const renderSVGChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-gray-400 font-semibold text-sm">
          No chart data available.
        </div>
      );
    }

    const svgWidth = 600;
    const svgHeight = 240;
    const paddingLeft = 55;
    const paddingRight = 15;
    const paddingTop = 20;
    const paddingBottom = 35;

    const plotWidth = svgWidth - paddingLeft - paddingRight;
    const plotHeight = svgHeight - paddingTop - paddingBottom;

    // Get max value for scaling
    const values = chartData.map(d => 
      chartMetric === "REVENUE" ? Number(d.revenue || 0) : Number(d.ordersCount || 0)
    );
    const maxValue = Math.max(...values, 0) || (chartMetric === "REVENUE" ? 1000 : 10);

    // Grid y coordinates
    const gridRows = 4;
    const yTicks = Array.from({ length: gridRows + 1 }, (_, idx) => (maxValue / gridRows) * idx);

    // Map points to SVG coordinates
    const points = chartData.map((d, index) => {
      const val = chartMetric === "REVENUE" ? Number(d.revenue || 0) : Number(d.ordersCount || 0);
      const x = paddingLeft + (index / (chartData.length - 1 || 1)) * plotWidth;
      const y = paddingTop + plotHeight - (val / maxValue) * plotHeight;
      return { x, y, label: d.label, revenue: d.revenue, ordersCount: d.ordersCount, value: val };
    });

    // Create line path d string
    let linePath = "";
    if (points.length > 0) {
      linePath = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ");
    }

    // Create closed area path d string
    let areaPath = "";
    if (points.length > 0) {
      areaPath = `M ${points[0].x} ${paddingTop + plotHeight} ` +
                 points.map(p => `L ${p.x} ${p.y}`).join(" ") +
                 ` L ${points[points.length - 1].x} ${paddingTop + plotHeight} Z`;
    }

    return (
      <div className="relative">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto">
          <defs>
            <linearGradient id="chartAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTicks.map((tick, i) => {
            const y = paddingTop + plotHeight - (tick / maxValue) * plotHeight;
            return (
              <g key={i} className="opacity-40">
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[10px] font-bold fill-gray-400"
                >
                  {chartMetric === "REVENUE" ? `₹${Math.round(tick).toLocaleString("en-IN")}` : Math.round(tick)}
                </text>
              </g>
            );
          })}

          {/* X Axis boundary */}
          <line
            x1={paddingLeft}
            y1={paddingTop + plotHeight}
            x2={svgWidth - paddingRight}
            y2={paddingTop + plotHeight}
            stroke="#cbd5e1"
            strokeWidth="1.5"
          />

          {/* Fill Area path under the line */}
          {areaPath && (
            <path d={areaPath} fill="url(#chartAreaGrad)" className="transition-all duration-300" />
          )}

          {/* Line Path */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#059669"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-300"
            />
          )}

          {/* Dots & Interaction areas */}
          {points.map((p, idx) => {
            // Show fewer X labels for daily to prevent overlap
            const showLabel = chartDimension !== "DAILY" || idx % 4 === 0 || idx === points.length - 1;

            return (
              <g key={idx} className="group cursor-pointer">
                {showLabel && (
                  <text
                    x={p.x}
                    y={paddingTop + plotHeight + 16}
                    textAnchor="middle"
                    className="text-[8px] sm:text-[9px] font-bold fill-gray-400"
                  >
                    {p.label}
                  </text>
                )}

                {/* Invisible hover area for larger trigger */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="12"
                  fill="transparent"
                  onMouseEnter={(e) => {
                    const rect = e.target.getBoundingClientRect();
                    setHoveredPoint({
                      label: p.label,
                      revenue: p.revenue,
                      ordersCount: p.ordersCount,
                      value: p.value,
                      x: p.x,
                      y: p.y,
                      clientX: rect.left + window.scrollX,
                      clientY: rect.top + window.scrollY
                    });
                  }}
                  onMouseLeave={() => setHoveredPoint(null)}
                />

                {/* Point dot circle */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={hoveredPoint?.label === p.label ? "5" : "3.5"}
                  fill={hoveredPoint?.label === p.label ? "#047857" : "#10b981"}
                  stroke="white"
                  strokeWidth="1.5"
                  className="transition-all duration-150"
                />
              </g>
            );
          })}
        </svg>

        {/* Floating Custom HTML Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute bg-slate-900/95 backdrop-blur-md text-white text-xs rounded-xl p-3 shadow-xl border border-slate-700 pointer-events-none z-30 animate-fadeIn space-y-1.5"
            style={{
              left: `${(hoveredPoint.x / svgWidth) * 100}%`,
              top: `${(hoveredPoint.y / svgHeight) * 100 - 35}%`,
              transform: "translate(-50%, -100%)",
            }}
          >
            <div className="font-extrabold border-b border-slate-700 pb-1 opacity-90 text-[10px] uppercase tracking-wide">
              {hoveredPoint.label}
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                Revenue: <strong>₹{Number(hoveredPoint.revenue || 0).toLocaleString("en-IN")}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                Orders: <strong>{hoveredPoint.ordersCount || 0}</strong>
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header section with Page Titles */}
      <div className="bg-white rounded-[32px] p-6 border border-green-50 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-green-950 flex items-center gap-3">
            <TrendingUp className="text-green-600" size={32} />
            Store Intelligence
          </h2>
          <p className="text-gray-500 mt-1 font-medium text-sm">
            Comprehensive analytics insights on store revenue, customer loyalty, conversion rates, and stock alerts.
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="self-start sm:self-center flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 px-5 py-3 rounded-2xl font-bold transition shadow-sm"
        >
          <RefreshCw size={16} />
          Refresh Stats
        </button>
      </div>

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue KPI */}
        <div className="bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:scale-[1.02] transition duration-200">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-3 translate-y-3">
            <IndianRupee size={120} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider opacity-75">Revenue Yield</span>
          <h3 className="text-2xl font-black mt-2">
            ₹{Number(analytics?.totalRevenue || 0).toLocaleString("en-IN")}
          </h3>
          <div className="mt-3 text-xs font-semibold opacity-90 flex justify-between items-center bg-white/10 p-2.5 rounded-xl border border-white/5">
            <span>Net Earning: ₹{Number(analytics?.netRevenue || 0).toLocaleString("en-IN")}</span>
            <span className="bg-emerald-500/30 text-emerald-100 font-bold px-2 py-0.5 rounded-full text-[9px] uppercase">
              {analytics?.totalRevenue > 0
                ? `${Math.round((Number(analytics.netRevenue) / Number(analytics.totalRevenue)) * 100)}% margins`
                : "0%"}
            </span>
          </div>
        </div>

        {/* Orders Card */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-md flex flex-col justify-between hover:scale-[1.02] transition duration-200">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Order Volume</span>
              <h3 className="text-2xl font-black text-green-950 mt-1">{analytics?.totalOrders || 0}</h3>
            </div>
            <div className="bg-green-50 text-green-700 p-2.5 rounded-xl">
              <FileText size={22} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 border-t border-gray-100 mt-4 pt-3 text-[10px] text-center text-gray-500 font-bold">
            <div>
              <span className="block text-yellow-600 font-black">{analytics?.pendingOrders || 0}</span>
              <span>Pending</span>
            </div>
            <div>
              <span className="block text-green-600 font-black">{analytics?.deliveredOrders || 0}</span>
              <span>Delivered</span>
            </div>
            <div>
              <span className="block text-red-600 font-black">{analytics?.cancelledOrders || 0}</span>
              <span>Cancelled</span>
            </div>
          </div>
        </div>

        {/* Customer Repeat Card */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-md flex flex-col justify-between hover:scale-[1.02] transition duration-200">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Loyalty Rate</span>
              <h3 className="text-2xl font-black text-green-950 mt-1">
                {analytics?.repeatCustomerRate?.toFixed(1) || "0.0"}%
              </h3>
            </div>
            <div className="bg-green-50 text-green-700 p-2.5 rounded-xl">
              <Users size={22} />
            </div>
          </div>
          <div className="border-t border-gray-100 mt-4 pt-3 flex items-center justify-between text-xs text-gray-500 font-semibold">
            <span>Repeat Customers:</span>
            <strong className="text-green-950 font-black">
              {analytics?.repeatCustomers || 0} / {analytics?.totalCustomers || 0}
            </strong>
          </div>
        </div>

        {/* Conversion Rate Card */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-md flex flex-col justify-between hover:scale-[1.02] transition duration-200">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Conversion Rate</span>
              <h3 className="text-2xl font-black text-green-950 mt-1">
                {analytics?.conversionRate?.toFixed(1) || "0.0"}%
              </h3>
            </div>
            <div className="bg-green-50 text-green-700 p-2.5 rounded-xl">
              <Eye size={22} />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-green-600 h-1.5 rounded-full"
                style={{ width: `${Math.min(analytics?.conversionRate || 0, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 font-bold mt-1.5">
              <span>Views: {analytics?.totalViews || 0}</span>
              <span>Purchases: {analytics?.totalPurchases || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts and Inventory Health Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Interactive Charts Panel */}
        <div className="lg:col-span-2 bg-white rounded-[32px] p-6 border border-green-50 shadow-lg flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-gray-100 pb-4 mb-4">
            <h3 className="text-xl font-black text-green-950 flex items-center gap-2">
              <Calendar className="text-green-600" size={20} />
              Performance Trends
            </h3>
            
            {/* Chart Metric and Dimension Selectors */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="flex bg-gray-50 border border-gray-100 p-1 rounded-xl">
                <button
                  onClick={() => setChartMetric("REVENUE")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    chartMetric === "REVENUE" ? "bg-green-600 text-white shadow" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Revenue
                </button>
                <button
                  onClick={() => setChartMetric("ORDERS")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    chartMetric === "ORDERS" ? "bg-green-600 text-white shadow" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Orders
                </button>
              </div>

              <div className="flex bg-gray-50 border border-gray-100 p-1 rounded-xl">
                {["DAILY", "WEEKLY", "MONTHLY", "YEARLY"].map(dim => (
                  <button
                    key={dim}
                    onClick={() => setChartDimension(dim)}
                    className={`px-2 py-1 rounded-lg font-black text-[10px] transition ${
                      chartDimension === dim ? "bg-green-100 text-green-800" : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    {dim.charAt(0) + dim.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Render Responsive SVG Chart */}
          <div className="bg-slate-50/50 border border-gray-100/50 rounded-2xl p-4 shadow-inner">
            {renderSVGChart()}
          </div>
          
          <div className="flex items-center gap-1.5 mt-3 text-[10px] text-gray-400 font-bold justify-end">
            <Info size={12} />
            <span>Hover on chart data points to view detailed breakdowns.</span>
          </div>
        </div>

        {/* Inventory Health Column */}
        <div className="bg-white rounded-[32px] p-6 border border-green-50 shadow-lg space-y-6 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-black text-green-950 flex items-center gap-2 border-b border-gray-100 pb-4 mb-4">
              <Layers className="text-green-600" size={20} />
              Stock & Inventory Health
            </h3>

            {/* Inventory Status List */}
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <span className="font-extrabold text-sm text-gray-600">Total Catalog Products</span>
                <span className="font-black text-base text-green-950">{analytics?.totalProducts || 0}</span>
              </div>
              <div className="flex justify-between items-center bg-green-50/50 p-4 rounded-2xl border border-green-100">
                <span className="font-extrabold text-sm text-green-800 flex items-center gap-2">
                  <CheckCircle size={16} /> Active Listings
                </span>
                <span className="font-black text-base text-green-950">{analytics?.activeProducts || 0}</span>
              </div>
              <div className="flex justify-between items-center bg-yellow-50 p-4 rounded-2xl border border-yellow-100">
                <span className="font-extrabold text-sm text-yellow-800 flex items-center gap-2">
                  <AlertCircle size={16} /> Low Stock Warnings
                </span>
                <span className={`font-black text-base ${analytics?.lowStockProducts > 0 ? "text-yellow-600" : "text-gray-400"}`}>
                  {analytics?.lowStockProducts || 0}
                </span>
              </div>
              <div className="flex justify-between items-center bg-red-50 p-4 rounded-2xl border border-red-100">
                <span className="font-extrabold text-sm text-red-800 flex items-center gap-2">
                  <AlertCircle size={16} /> Out of Stock Alerts
                </span>
                <span className={`font-black text-base ${analytics?.outOfStockProducts > 0 ? "text-red-600 animate-pulse" : "text-gray-400"}`}>
                  {analytics?.outOfStockProducts || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Action Callout depending on Health */}
          {(analytics?.lowStockProducts > 0 || analytics?.outOfStockProducts > 0) ? (
            <div className="bg-amber-50 border border-amber-200 text-amber-950 rounded-2xl p-4 text-xs font-semibold space-y-1.5 shadow-sm">
              <h4 className="font-black text-amber-900 flex items-center gap-1.5 uppercase text-[10px] tracking-wide">
                <Info size={14} className="text-amber-700" /> Catalog Attention Needed
              </h4>
              <p>You have items in your catalog that are either out of stock or low. Update quantities to prevent orders cancellation.</p>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 text-green-950 rounded-2xl p-4 text-xs font-semibold space-y-1.5 shadow-sm">
              <h4 className="font-black text-green-900 flex items-center gap-1.5 uppercase text-[10px] tracking-wide">
                <PackageCheck size={14} className="text-green-700" /> Healthy Inventory
              </h4>
              <p>Excellent! All your listed products are currently in stock and above catalog reorder thresholds.</p>
            </div>
          )}
        </div>
      </div>

      {/* Customer Reviews & Ratings Analytics */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Rating Overview */}
        <div className="bg-white rounded-[32px] p-6 border border-green-50 shadow-lg space-y-4 flex flex-col justify-between hover:scale-[1.02] transition duration-200">
          <div>
            <h3 className="text-lg font-black text-green-950 flex items-center gap-2 border-b border-gray-100 pb-3 mb-3">
              <Star className="text-green-600 fill-green-600 animate-pulse" size={18} />
              Seller Rating Overview
            </h3>
            <div className="flex items-center gap-4 py-2">
              <div className="text-5xl font-black text-green-950">
                {analytics?.averageRating ? Number(analytics.averageRating).toFixed(1) : "0.0"}
              </div>
              <div className="space-y-1">
                <div className="flex items-center text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star 
                      key={i} 
                      size={16} 
                      className={i < Math.round(analytics?.averageRating || 0) ? "fill-amber-500" : "text-gray-200"} 
                    />
                  ))}
                </div>
                <span className="text-[10px] font-bold text-gray-400 block uppercase">
                  Based on {analytics?.totalReviews || 0} reviews
                </span>
              </div>
            </div>
          </div>
          <div className="bg-green-50/50 border border-green-100 p-4 rounded-2xl">
            <span className="text-[10px] font-black uppercase text-green-800 block tracking-wide">CSAT Score</span>
            <div className="text-xl font-black text-green-950 mt-1">
              {analytics?.customerSatisfactionScore ? Number(analytics.customerSatisfactionScore).toFixed(1) : "0.0"}%
            </div>
            <p className="text-[10px] font-bold text-green-700 mt-1">Percentage of 4 & 5 star ratings</p>
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="bg-white rounded-[32px] p-6 border border-green-50 shadow-lg space-y-4 hover:scale-[1.02] transition duration-200">
          <h3 className="text-lg font-black text-green-950 flex items-center gap-2 border-b border-gray-100 pb-3">
            <Layers className="text-green-600" size={18} />
            Rating Distribution
          </h3>
          <div className="space-y-2.5 pt-1">
            {[5, 4, 3, 2, 1].map(stars => {
              const count = analytics?.ratingDistribution?.[stars] || 0;
              const total = analytics?.totalReviews || 1;
              const pct = (count / total) * 100;
              return (
                <div key={stars} className="flex items-center gap-3 text-xs font-bold text-gray-700">
                  <span className="w-3 text-right">{stars}★</span>
                  <div className="flex-1 bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-gray-400">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sub-ratings averages */}
        <div className="bg-white rounded-[32px] p-6 border border-green-50 shadow-lg space-y-4 hover:scale-[1.02] transition duration-200">
          <h3 className="text-lg font-black text-green-950 flex items-center gap-2 border-b border-gray-100 pb-3">
            <MessageCircle className="text-green-600" size={18} />
            Experience Breakdown
          </h3>
          <div className="space-y-4 pt-1">
            {[
              { label: "Product Quality", val: analytics?.productQualityAvg || 0 },
              { label: "Communication", val: analytics?.communicationAvg || 0 },
              { label: "Delivery Experience", val: analytics?.deliveryExperienceAvg || 0 }
            ].map((sub, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-gray-700">
                  <span>{sub.label}</span>
                  <span className="text-green-800">{Number(sub.val).toFixed(1)} / 5.0</span>
                </div>
                <div className="flex items-center text-amber-500 gap-0.5">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star 
                      key={idx} 
                      size={12} 
                      className={idx < Math.round(sub.val) ? "fill-amber-500" : "text-gray-250"} 
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products performance leaderboard */}
      <div className="bg-white rounded-[32px] p-6 border border-green-50 shadow-lg space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <h3 className="text-xl font-black text-green-950 flex items-center gap-2">
            <ShoppingBag className="text-green-600" size={20} />
            Top Product Rankings
          </h3>
          <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Top 5 Products</span>
        </div>

        {analytics?.topProducts?.length === 0 ? (
          <div className="text-center py-12 text-gray-400 font-bold text-sm">
            No sales data recorded for your catalog products yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-150 bg-white shadow-inner">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-500 font-bold border-b border-gray-150">
                  <th className="p-4 pl-6">Product Details</th>
                  <th className="p-4">SKU</th>
                  <th className="p-4 text-right">Unit Price</th>
                  <th className="p-4 text-center">Quantity Sold</th>
                  <th className="p-4 text-right pr-6">Generated Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-extrabold text-gray-700">
                {analytics?.topProducts?.map((prod, i) => (
                  <tr key={prod.id} className="hover:bg-gray-50/50 transition">
                    <td className="p-4 pl-6 flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-green-50 text-green-700 font-black text-xs flex items-center justify-center border border-green-100 flex-shrink-0">
                        {i + 1}
                      </span>
                      <div>
                        <div className="font-extrabold text-green-950 text-sm">{prod.productName}</div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-400 font-mono text-[10px] font-bold">{prod.sku || "N/A"}</td>
                    <td className="p-4 text-right">{formatPrice(prod.price)}</td>
                    <td className="p-4 text-center">
                      <span className="bg-blue-50 text-blue-800 font-black px-2.5 py-1 rounded-lg text-[10px]">
                        {prod.quantitySold} units
                      </span>
                    </td>
                    <td className="p-4 text-right pr-6 font-black text-green-700 text-sm">
                      <span className="flex items-center justify-end gap-1.5">
                        {formatPrice(prod.totalRevenue)}
                        <ArrowUpRight size={14} className="text-green-500 flex-shrink-0" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
