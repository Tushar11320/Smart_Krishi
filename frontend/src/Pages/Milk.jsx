import React, { useEffect, useState } from "react";
import api, { formatPrice, getPrimaryImage, unwrapPage } from "../services/api";
import { 
  Search, 
  MapPin, 
  ShoppingCart, 
  ShoppingBag, 
  Star, 
  X, 
  AlertCircle, 
  CheckCircle,
  Filter,
  RotateCcw,
  Truck,
  Droplet,
  Compass,
  Calendar,
  Clock
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import ReviewsTab from "../components/ReviewsTab";

export default function MilkSelling() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("BROWSE"); // BROWSE or TRACK
  
  // Marketplace states
  const [milks, setMilks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [milkTypeFilter, setMilkTypeFilter] = useState("");
  const [minFat, setMinFat] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // Delivery tracking states
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Detail Modal & Action feedback states
  const [selectedMilk, setSelectedMilk] = useState(null);
  const [cartLoading, setCartLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const getLoggedInUser = () => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  };

  const user = getLoggedInUser();
  const userId = user?.id;

  const fetchMilks = async () => {
    setIsLoading(true);
    setError("");
    try {
      const params = {
        size: 24,
        keyword: keyword || undefined,
        milkType: milkTypeFilter || undefined,
        minFat: minFat ? Number(minFat) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined
      };
      const response = await api.get("/milk/search", { params });
      setMilks(unwrapPage(response));
    } catch (err) {
      console.error("Failed to load milk listings:", err);
      setError("Failed to fetch milk listings.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBuyerOrders = async () => {
    if (!userId) return;
    setOrdersLoading(true);
    try {
      const response = await api.get(`/orders/buyer/${userId}`, { params: { size: 50 } });
      const orderPage = response.data?.data?.content || response.data?.content || [];
      
      // Filter orders to only highlight those containing milk products, or just all orders for tracking simplicity
      setOrders(orderPage);
    } catch (err) {
      console.error("Failed to load buyer orders:", err);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "BROWSE") {
      const delayDebounceFn = setTimeout(() => {
        fetchMilks();
      }, 400);
      return () => clearTimeout(delayDebounceFn);
    } else {
      fetchBuyerOrders();
    }
  }, [activeTab, keyword, milkTypeFilter, minFat, maxPrice]);

  const handleResetFilters = () => {
    setKeyword("");
    setMilkTypeFilter("");
    setMinFat("");
    setMaxPrice("");
  };

  const handleAddToCart = async (milk, quantity = 1, redirectToCart = false) => {
    if (!userId) {
      setError("Please log in to purchase milk.");
      setTimeout(() => navigate("/account"), 1500);
      return;
    }

    setCartLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        productId: milk.productId,
        quantity: quantity,
        cartId: 0
      };
      await api.post(`/cart/${userId}/items`, payload);
      
      setSuccess(`Successfully added ${quantity} Liter(s) of fresh ${milk.milkType} milk to your cart! 🥛`);
      
      if (redirectToCart) {
        navigate("/cart");
      }
    } catch (err) {
      console.error("Cart action failed:", err);
      setError(err.response?.data?.message || "Failed to update shopping cart.");
    } finally {
      setCartLoading(false);
    }
  };

  // Helper to draw status tracker
  const getStatusStepIndex = (status) => {
    const steps = ["PENDING", "ACCEPTED", "PROCESSING", "SHIPPED", "DELIVERED"];
    return steps.indexOf(status.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100/40 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-950 rounded-3xl p-6 md:p-10 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
          <div className="space-y-2 relative z-10 text-center md:text-left">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">Milk & Dairy Marketplace</h1>
            <p className="text-blue-100 max-w-xl text-sm md:text-base font-bold">
              Direct farm fresh milk delivery. Standard fat percentage verifications, fresh milking availability, and customized delivery radius metrics.
            </p>
          </div>
          
          <div className="flex gap-2.5 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 z-10">
            <button 
              onClick={() => setActiveTab("BROWSE")}
              className={`px-5 py-3 rounded-xl font-extrabold text-xs transition ${activeTab === "BROWSE" ? "bg-white text-blue-900 shadow" : "text-white hover:bg-white/10"}`}
            >
              Browse fresh milk
            </button>
            <button 
              onClick={() => setActiveTab("TRACK")}
              className={`px-5 py-3 rounded-xl font-extrabold text-xs transition ${activeTab === "TRACK" ? "bg-white text-blue-900 shadow" : "text-white hover:bg-white/10"}`}
            >
              Track Deliveries
            </button>
          </div>
          
          <div className="absolute right-0 bottom-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        </div>

        {/* Global Notifications */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-2xl flex items-center gap-3 font-semibold animate-fadeIn">
            <CheckCircle className="text-green-600 flex-shrink-0" size={22} />
            <div className="text-sm">{success}</div>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl flex items-center gap-3 font-semibold animate-fadeIn">
            <AlertCircle className="text-red-600 flex-shrink-0" size={22} />
            <div className="text-sm">{error}</div>
          </div>
        )}

        {/* TAB 1: BROWSE MILK */}
        {activeTab === "BROWSE" && (
          <div className="flex flex-col lg:flex-row gap-8 animate-fadeIn">
            
            {/* Sidebar Filters */}
            <div className="lg:w-80 flex-shrink-0">
              <div className="bg-white rounded-3xl p-6 border border-blue-100 shadow-md sticky top-6 space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                  <h3 className="font-black text-blue-950 flex items-center gap-2">
                    <Filter size={18} className="text-blue-600" />
                    Filter Milk listings
                  </h3>
                  {(keyword || milkTypeFilter || minFat || maxPrice) && (
                    <button 
                      onClick={handleResetFilters}
                      className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1 transition"
                    >
                      <RotateCcw size={12} /> Reset
                    </button>
                  )}
                </div>

                {/* Keyword search */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">Search Keywords</label>
                  <div className="relative">
                    <input
                      type="text"
                      id="milk-search"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      placeholder="e.g. Organic Cow Milk"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    />
                    <Search className="absolute left-3.5 top-3.5 text-gray-400" size={16} />
                  </div>
                </div>

                {/* Milk Type filter */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">Milk Type</label>
                  <select
                    id="milk-type-select"
                    value={milkTypeFilter}
                    onChange={(e) => setMilkTypeFilter(e.target.value)}
                    className="w-full p-3 rounded-xl border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-blue-500 transition"
                  >
                    <option value="">All Milk Types</option>
                    <option value="Cow">Cow</option>
                    <option value="Buffalo">Buffalo</option>
                    <option value="Goat">Goat</option>
                  </select>
                </div>

                {/* Min Fat Percentage */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">Min Fat Percentage (%)</label>
                  <input
                    type="number"
                    id="fat-min"
                    step="0.1"
                    placeholder="e.g. 3.5"
                    value={minFat}
                    onChange={(e) => setMinFat(e.target.value)}
                    className="p-3 rounded-xl border border-gray-200 text-sm w-full text-center focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>

                {/* Max Price limit */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">Max Price limit (₹/L)</label>
                  <input
                    type="number"
                    id="price-max-milk"
                    placeholder="e.g. 80"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="p-3 rounded-xl border border-gray-200 text-sm w-full text-center focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
              </div>
            </div>

            {/* Marketplace Grid */}
            <div className="flex-grow">
              {isLoading ? (
                <div className="text-center py-24">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-400 font-bold">Locating fresh dairy batches...</p>
                </div>
              ) : milks.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-blue-50 shadow-md">
                  <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
                  <h4 className="text-lg font-bold text-gray-700">No matching milk products found</h4>
                  <p className="text-sm text-gray-400 mt-1">Try broadening your search criteria or price thresholds.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {milks.map((milk) => {
                    const hasStock = milk.quantity > 0;
                    return (
                      <div 
                        key={milk.id} 
                        className="bg-white rounded-[32px] border border-gray-100 hover:border-blue-300 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group h-full"
                      >
                        {/* Image banner */}
                        <div className="h-48 relative overflow-hidden bg-blue-50">
                          <img
                            src={getPrimaryImage(milk)}
                            alt={milk.productName}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          />
                          <span className="absolute top-4 left-4 bg-blue-900/80 backdrop-blur-sm text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider">
                            {milk.milkType} milk
                          </span>
                          {milk.dailyAvailability ? (
                            <span className="absolute top-4 right-4 bg-green-500/90 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase">
                              Available Daily
                            </span>
                          ) : (
                            <span className="absolute top-4 right-4 bg-yellow-500/90 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase">
                              Seasonal Batch
                            </span>
                          )}
                          <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm text-xs font-extrabold text-blue-950">
                            <Compass size={12} className="text-blue-600" />
                            {milk.deliveryRadius} km Radius
                          </div>
                        </div>

                        {/* Description contents */}
                        <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                          <div className="space-y-2">
                            <div className="flex justify-between items-start gap-2">
                              <h3 className="text-lg font-black text-blue-950 group-hover:text-blue-700 transition duration-300">
                                {milk.productName}
                              </h3>
                              <span className="flex items-center gap-1 bg-blue-50 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                                <Droplet size={10} className="fill-blue-500 text-blue-500" />
                                {milk.fatPercentage}% Fat
                              </span>
                            </div>
                            
                            <p className="text-xs text-gray-400 font-bold line-clamp-2">
                              {milk.description || "Farm fresh organic milk sourced under strict sanitary conditions."}
                            </p>

                            <div className="text-xs font-semibold text-gray-500 pt-1">
                              Milking Source: <strong className="text-gray-800 font-extrabold">{milk.sellerBusinessName || "Local Farm"}</strong>
                            </div>
                          </div>

                          {/* Action section */}
                          <div className="pt-3 border-t border-gray-100 flex flex-col space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Price per Liter</span>
                              <div className="text-xl font-black text-blue-700">
                                {formatPrice(milk.price)}
                                <span className="text-xs text-gray-400 font-bold"> / L</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => setSelectedMilk(milk)}
                                className="py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-xs rounded-xl transition"
                              >
                                Batch Details
                              </button>
                              <button
                                disabled={!hasStock || cartLoading}
                                onClick={() => handleAddToCart(milk, 1, false)}
                                className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 disabled:bg-gray-100 disabled:text-gray-400"
                              >
                                <ShoppingCart size={13} />
                                Add To Cart
                              </button>
                            </div>

                            <button
                              disabled={!hasStock || cartLoading}
                              onClick={() => handleAddToCart(milk, 1, true)}
                              className="w-full py-2.5 bg-indigo-900 hover:bg-indigo-950 text-white font-black text-xs rounded-xl transition disabled:bg-gray-100 disabled:text-gray-400"
                            >
                              Order Now
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: TRACK DELIVERIES */}
        {activeTab === "TRACK" && (
          <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn">
            <div className="bg-white rounded-[32px] p-8 border border-blue-50 shadow-md">
              <h2 className="text-2xl font-black text-blue-950 flex items-center gap-2 border-b border-gray-100 pb-4">
                <Truck className="text-blue-600 animate-bounce" size={24} />
                Live Dairy Deliveries
              </h2>

              {!userId ? (
                <div className="text-center py-12 text-gray-400 font-bold">
                  Please log in to view and track your purchase deliveries.
                </div>
              ) : ordersLoading ? (
                <div className="text-center py-12">
                  <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-gray-400 font-bold">Syncing delivery logistics...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-16 text-gray-400 font-bold">
                  No delivery track history available. Try ordering fresh milk!
                </div>
              ) : (
                <div className="space-y-8 mt-6">
                  {orders.map((ord) => {
                    const progressIdx = getStatusStepIndex(ord.orderStatus);
                    const steps = ["Pending", "Accepted", "Processing", "Shipped", "Delivered"];
                    return (
                      <div key={ord.id} className="border border-gray-100 rounded-3xl p-6 bg-gray-50/50 hover:border-blue-200 transition space-y-4">
                        
                        {/* Summary line */}
                        <div className="flex justify-between items-center flex-wrap gap-2 pb-3 border-b border-gray-100 text-xs font-semibold text-gray-600">
                          <div>
                            <span className="text-gray-400 block text-[9px] uppercase font-black">Order ID</span>
                            <strong className="text-blue-950 text-sm">{ord.orderNumber}</strong>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-[9px] uppercase font-black">Amount paid</span>
                            <strong className="text-green-700 text-sm">{formatPrice(ord.totalAmount)}</strong>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-[9px] uppercase font-black">MILK DELIVERY TARGET</span>
                            <strong className="text-gray-700 text-xs truncate max-w-[200px] block">{ord.shippingAddress}</strong>
                          </div>
                        </div>

                        {/* Tracker Progress Bar */}
                        {ord.orderStatus === "CANCELLED" ? (
                          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl flex items-center gap-3 font-semibold mt-2">
                            <AlertCircle className="text-red-600 flex-shrink-0" size={22} />
                            <div>
                              <div className="text-sm font-black">Order Cancelled</div>
                              {ord.cancellationReason && (
                                <div className="text-xs text-red-600/80 font-bold mt-0.5">Reason: {ord.cancellationReason}</div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="py-2">
                            <div className="flex justify-between text-[10px] font-black text-gray-400 mb-2.5">
                              <span>Status Check</span>
                              <span className="text-blue-600 uppercase flex items-center gap-1">
                                <Clock size={11} /> {ord.orderStatus}
                              </span>
                            </div>

                            {/* Horizontal Bar */}
                            <div className="relative h-2.5 bg-gray-200 rounded-full overflow-hidden flex">
                              <div 
                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500" 
                                style={{ width: `${((progressIdx + 1) / steps.length) * 100}%` }}
                              ></div>
                            </div>

                            {/* Step Labels */}
                            <div className="grid grid-cols-5 gap-1 mt-3 text-center">
                              {steps.map((st, idx) => (
                                <div key={idx} className="flex flex-col items-center">
                                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold ${
                                    idx <= progressIdx ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-400"
                                  }`}>
                                    {idx + 1}
                                  </div>
                                  <span className={`text-[8px] md:text-[9px] font-extrabold mt-1 truncate w-full ${
                                    idx <= progressIdx ? "text-blue-900" : "text-gray-400"
                                  }`}>
                                    {st}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Order items lists */}
                        <div className="pt-2 flex justify-between items-center text-xs font-semibold text-gray-500">
                          <div>
                            Items: <strong className="text-gray-700">{ord.orderItems?.map(i => `${i.productName} (x${i.quantity})`).join(", ")}</strong>
                          </div>
                          {ord.expectedDeliveryDate && (
                            <div className="text-right flex items-center gap-1 text-[11px] bg-blue-50 text-blue-900 px-3 py-1 rounded-xl">
                              <Calendar size={12} /> Expected: {new Date(ord.expectedDeliveryDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedMilk && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[32px] w-full max-w-xl shadow-2xl border border-gray-100 overflow-hidden animate-scaleUp">
            
            {/* Image Header */}
            <div className="h-64 relative bg-blue-50">
              <img
                src={getPrimaryImage(selectedMilk)}
                alt={selectedMilk.productName}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedMilk(null)}
                className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition"
              >
                <X size={20} />
              </button>
              <div className="absolute bottom-4 left-6 bg-blue-900/90 backdrop-blur-md px-4 py-2 rounded-2xl text-white font-black uppercase tracking-wider text-xs shadow-md">
                {selectedMilk.milkType} Milk
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div>
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-black text-blue-950">{selectedMilk.productName}</h3>
                  <div className="text-2xl font-black text-blue-700">
                    {formatPrice(selectedMilk.price)}
                    <span className="text-sm font-bold text-gray-400"> / Liter</span>
                  </div>
                </div>
                {selectedMilk.sellerBusinessName && (
                  <p className="text-xs text-gray-400 font-bold mt-1">Farm milks processed by: {selectedMilk.sellerBusinessName}</p>
                )}
              </div>

              {/* Grid specifics */}
              <div className="grid grid-cols-3 gap-4 bg-blue-50/40 p-4 rounded-2xl border border-blue-100/30 text-xs font-semibold text-center">
                <div>
                  <span className="text-gray-400 block text-[9px] uppercase font-black">Fat Percentage</span>
                  <strong className="text-blue-900 text-sm block mt-1">{selectedMilk.fatPercentage}%</strong>
                </div>
                <div>
                  <span className="text-gray-400 block text-[9px] uppercase font-black">Delivery Range</span>
                  <strong className="text-blue-900 text-sm block mt-1">{selectedMilk.deliveryRadius} km</strong>
                </div>
                <div>
                  <span className="text-gray-400 block text-[9px] uppercase font-black">Stock Available</span>
                  <strong className="text-blue-900 text-sm block mt-1">{selectedMilk.quantity} Liters</strong>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h4 className="font-black text-blue-950 text-sm">Batch Description</h4>
                <p className="text-sm text-gray-500 font-bold leading-relaxed">
                  {selectedMilk.description || "Fresh milk listing from verified dairy farmers. Tested for zero contamination and natural freshness."}
                </p>
              </div>

              {/* Reviews Panel */}
              <div className="pt-6 border-t border-gray-100">
                <h4 className="font-black text-blue-950 text-sm mb-4">Customer Reviews & Ratings</h4>
                <ReviewsTab productId={selectedMilk.productId || selectedMilk.id} />
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-gray-100 flex gap-4">
                <button
                  onClick={() => setSelectedMilk(null)}
                  className="px-5 py-3 border border-gray-200 hover:bg-gray-50 text-gray-600 font-black text-xs rounded-xl transition"
                >
                  Close
                </button>
                <button
                  disabled={selectedMilk.quantity <= 0 || cartLoading}
                  onClick={() => {
                    handleAddToCart(selectedMilk, 1, false);
                    setSelectedMilk(null);
                  }}
                  className="flex-grow py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                >
                  <ShoppingCart size={15} />
                  Add Liter to Shopping Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
