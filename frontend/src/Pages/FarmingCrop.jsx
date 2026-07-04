import React, { useEffect, useState } from "react";
import api, { formatPrice, getPrimaryImage, unwrapPage } from "../services/api";
import { 
  Search, 
  MapPin, 
  Calendar, 
  ShoppingCart, 
  ShoppingBag, 
  Star, 
  X, 
  AlertCircle, 
  CheckCircle,
  Filter,
  RotateCcw
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import ReviewsTab from "../components/ReviewsTab";

export default function FarmingCrop() {
  const navigate = useNavigate();
  const [crops, setCrops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Search & Filter state
  const [keyword, setKeyword] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  
  // Detail Modal & Action feedback states
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [cartLoading, setCartLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const stateOptions = [
    "Punjab", "Haryana", "Maharashtra", "Madhya Pradesh", 
    "Uttar Pradesh", "Rajasthan", "Gujarat", "Karnataka", 
    "Andhra Pradesh", "Tamil Nadu", "Bihar", "West Bengal"
  ];

  const fetchCrops = async () => {
    setIsLoading(true);
    setError("");
    try {
      const params = {
        size: 24,
        keyword: keyword || undefined,
        state: stateFilter || undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined
      };
      const response = await api.get("/crops/search", { params });
      setCrops(unwrapPage(response));
    } catch (err) {
      console.error("Failed to fetch crops marketplace listings:", err);
      setError("Failed to load crop listings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Debounce/Fetch on filter change
    const delayDebounceFn = setTimeout(() => {
      fetchCrops();
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [keyword, stateFilter, minPrice, maxPrice]);

  const handleResetFilters = () => {
    setKeyword("");
    setStateFilter("");
    setMinPrice("");
    setMaxPrice("");
  };

  const getLoggedInUser = () => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  };

  const handleAddToCart = async (crop, quantity = 1, redirectToCart = false) => {
    const user = getLoggedInUser();
    if (!user) {
      setError("Please log in to add items to your cart.");
      setTimeout(() => navigate("/account"), 1500);
      return;
    }

    setCartLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        productId: crop.productId,
        quantity: quantity,
        cartId: 0 // Mock/not verified, backend resolves by user ID anyway
      };
      await api.post(`/cart/${user.id}/items`, payload);
      
      setSuccess(`Added ${quantity} ${crop.unit || "unit(s)"} of ${crop.cropName} to cart! 🌾`);
      
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100/40 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Page Heading banner */}
        <div className="bg-gradient-to-r from-green-700 to-emerald-900 rounded-3xl p-6 md:p-10 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
          <div className="space-y-2 relative z-10 text-center md:text-left">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">Crops Marketplace</h1>
            <p className="text-green-100 max-w-xl text-sm md:text-base font-bold">
              Direct connection between farmers and merchants. Quality agricultural yields, certified grain listings, and transparent pricing.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-center min-w-[200px] z-10">
            <h4 className="text-xs uppercase font-black text-green-200 tracking-wider">Active Listings</h4>
            <div className="text-4xl font-black mt-1">{crops.length} Yields</div>
          </div>
          {/* Subtle green aesthetic background mesh */}
          <div className="absolute right-0 bottom-0 w-80 h-80 bg-green-500/10 rounded-full blur-3xl"></div>
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

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left panel: Filters (Sidebar) */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-3xl p-6 border border-green-100 shadow-md sticky top-6 space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <h3 className="font-black text-green-950 flex items-center gap-2">
                  <Filter size={18} className="text-green-600" />
                  Filter Listings
                </h3>
                {(keyword || stateFilter || minPrice || maxPrice) && (
                  <button 
                    onClick={handleResetFilters}
                    className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1 transition"
                  >
                    <RotateCcw size={12} /> Reset
                  </button>
                )}
              </div>

              {/* Keyword Search */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">Search Crop Name</label>
                <div className="relative">
                  <input
                    type="text"
                    id="search-input"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="e.g. Rice, Wheat, Soybean"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                  />
                  <Search className="absolute left-3.5 top-3.5 text-gray-400" size={16} />
                </div>
              </div>

              {/* State Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">Cultivation State</label>
                <select
                  id="state-select"
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                >
                  <option value="">All Regions / States</option>
                  {stateOptions.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">Price Range (₹)</label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    id="price-min"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="p-3 rounded-xl border border-gray-200 text-sm w-full text-center focus:ring-2 focus:ring-green-500 transition"
                  />
                  <input
                    type="number"
                    id="price-max"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="p-3 rounded-xl border border-gray-200 text-sm w-full text-center focus:ring-2 focus:ring-green-500 transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right panel: Marketplace Grid */}
          <div className="flex-grow">
            {isLoading ? (
              <div className="text-center py-24">
                <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400 font-bold">Fetching verified listings...</p>
              </div>
            ) : crops.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-green-50 shadow-md">
                <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
                <h4 className="text-lg font-bold text-gray-700">No matching crop listings found</h4>
                <p className="text-sm text-gray-400 mt-1">Try adjusting your keyword filter or search queries.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {crops.map((crop) => {
                  const hasStock = crop.quantity > 0;
                  return (
                    <div 
                      key={crop.id} 
                      className="bg-white rounded-[32px] border border-gray-100 hover:border-green-300 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group h-full"
                    >
                      {/* Image header banner */}
                      <div className="h-48 relative overflow-hidden bg-green-50">
                        <img
                          src={getPrimaryImage(crop)}
                          alt={crop.cropName}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                        <span className="absolute top-4 left-4 bg-green-900/80 backdrop-blur-sm text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider">
                          {crop.variety || "Cultivar"}
                        </span>
                        {crop.location && (
                          <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm text-xs font-extrabold text-green-950">
                            <MapPin size={12} className="text-green-600" />
                            {crop.location}
                          </div>
                        )}
                      </div>

                      {/* Content information block */}
                      <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start gap-2">
                            <h3 className="text-lg font-black text-green-950 group-hover:text-green-700 transition duration-300">
                              {crop.cropName}
                            </h3>
                            <span className="flex items-center gap-1 bg-yellow-50 text-yellow-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                              <Star size={10} className="fill-yellow-500 text-yellow-500" />
                              4.8
                            </span>
                          </div>
                          
                          <p className="text-xs text-gray-400 font-bold line-clamp-2">
                            {crop.description || "Fresh crop cultivation listed directly from local farmers."}
                          </p>

                          <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-gray-500 pt-1">
                            <div>Stock: <strong className={hasStock ? "text-green-700 font-extrabold" : "text-red-500 font-extrabold"}>
                              {hasStock ? `${crop.quantity} ${crop.unit || "units"}` : "Out of stock"}
                            </strong></div>
                            {crop.harvestDate && (
                              <div className="text-right">Harvest: <strong className="text-gray-700 font-extrabold">{new Date(crop.harvestDate).toLocaleDateString()}</strong></div>
                            )}
                          </div>
                        </div>

                        {/* Actions line */}
                        <div className="pt-3 border-t border-gray-100 flex flex-col space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Price Quote</span>
                            <div className="text-xl font-black text-green-700">
                              {formatPrice(crop.price)}
                              <span className="text-xs text-gray-400 font-bold"> / {crop.unit || "unit"}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => setSelectedCrop(crop)}
                              className="py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-xs rounded-xl transition-all"
                            >
                              More Details
                            </button>
                            <button
                              disabled={!hasStock || cartLoading}
                              onClick={() => handleAddToCart(crop, 1, false)}
                              className="py-2.5 bg-green-600 hover:bg-green-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 disabled:bg-gray-200 disabled:text-gray-400"
                            >
                              <ShoppingCart size={13} />
                              Add To Cart
                            </button>
                          </div>

                          <button
                            disabled={!hasStock || cartLoading}
                            onClick={() => handleAddToCart(crop, 1, true)}
                            className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-950 text-white font-black text-xs rounded-xl transition-all disabled:bg-gray-100 disabled:text-gray-400"
                          >
                            Buy Yield Now
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
      </div>

      {/* Details View Modal */}
      {selectedCrop && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl border border-gray-100 overflow-hidden animate-scaleUp">
            
            {/* Header image banner in modal */}
            <div className="h-64 relative bg-green-50">
              <img
                src={getPrimaryImage(selectedCrop)}
                alt={selectedCrop.cropName}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedCrop(null)}
                className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition"
              >
                <X size={20} />
              </button>
              <div className="absolute bottom-4 left-6 bg-green-900/95 backdrop-blur-md px-4 py-2 rounded-2xl text-white font-black uppercase tracking-wider text-xs shadow-md">
                {selectedCrop.variety} Variety
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div>
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-black text-green-950">{selectedCrop.cropName}</h3>
                  <div className="text-2xl font-black text-green-700">
                    {formatPrice(selectedCrop.price)}
                    <span className="text-sm font-bold text-gray-400"> / {selectedCrop.unit || "unit"}</span>
                  </div>
                </div>
                {selectedCrop.scientificName && (
                  <p className="text-xs text-green-600 font-mono italic mt-1">{selectedCrop.scientificName}</p>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-5 rounded-2xl border border-gray-100 text-xs font-semibold">
                <div>
                  <span className="text-gray-400 block font-bold uppercase text-[9px]">Growing Season</span>
                  <strong className="text-gray-700 font-bold block mt-1">{selectedCrop.growingSeason || "N/A"}</strong>
                </div>
                <div>
                  <span className="text-gray-400 block font-bold uppercase text-[9px]">Crop Type</span>
                  <strong className="text-gray-700 font-bold block mt-1">{selectedCrop.cropType || "Cereal"}</strong>
                </div>
                <div>
                  <span className="text-gray-400 block font-bold uppercase text-[9px]">Harvest Date</span>
                  <strong className="text-gray-700 font-bold block mt-1">
                    {selectedCrop.harvestDate ? new Date(selectedCrop.harvestDate).toLocaleDateString() : "N/A"}
                  </strong>
                </div>
                <div>
                  <span className="text-gray-400 block font-bold uppercase text-[9px]">Location</span>
                  <strong className="text-gray-700 font-bold block mt-1">{selectedCrop.location || "N/A"}</strong>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-green-950 text-sm">Detailed Crop Description</h4>
                <p className="text-sm text-gray-500 font-bold leading-relaxed">
                  {selectedCrop.description || "No description provided for this crop yield."}
                </p>
              </div>

              {/* Reviews Panel */}
              <div className="pt-6 border-t border-gray-100">
                <h4 className="font-black text-green-950 text-sm mb-4">Customer Reviews & Ratings</h4>
                <ReviewsTab productId={selectedCrop.productId || selectedCrop.id} />
              </div>

              {selectedCrop.sellerBusinessName && (
                <div className="border-t border-gray-100 pt-4 flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold">
                      {selectedCrop.sellerBusinessName.substring(0, 1)}
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[9px]">Cultivated & Listed By</span>
                      <strong className="text-gray-700 font-bold">{selectedCrop.sellerBusinessName}</strong>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[9px] text-right">Available Stock</span>
                    <strong className="text-green-700 font-black text-sm">{selectedCrop.quantity} {selectedCrop.unit || "unit(s)"}</strong>
                  </div>
                </div>
              )}

              {/* Action Buttons in Modal */}
              <div className="pt-4 border-t border-gray-100 flex gap-4">
                <button
                  onClick={() => setSelectedCrop(null)}
                  className="px-6 py-3 border border-gray-200 hover:bg-gray-50 text-gray-600 font-black text-sm rounded-xl transition"
                >
                  Close Detail Panel
                </button>
                <button
                  disabled={selectedCrop.quantity <= 0 || cartLoading}
                  onClick={() => {
                    handleAddToCart(selectedCrop, 1, false);
                    setSelectedCrop(null);
                  }}
                  className="flex-grow py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-200 text-white font-black text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                >
                  <ShoppingCart size={16} />
                  Add Crop to Shopping Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
