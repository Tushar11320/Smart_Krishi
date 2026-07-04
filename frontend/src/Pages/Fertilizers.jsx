import React, { useEffect, useState } from "react";
import api, { formatPrice, getPrimaryImage, unwrapPage } from "../services/api";
import { 
  Search, 
  ShoppingCart, 
  ShoppingBag, 
  X, 
  AlertCircle, 
  CheckCircle,
  Filter,
  RotateCcw,
  Calendar,
  Tag,
  ShieldCheck,
  TrendingUp,
  Package
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import ReviewsTab from "../components/ReviewsTab";

export default function FertilizersMarketplace() {
  const navigate = useNavigate();
  
  // Marketplace states
  const [fertilizers, setFertilizers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // Detail Modal & Action feedback states
  const [selectedFertilizer, setSelectedFertilizer] = useState(null);
  const [cartLoading, setCartLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const getLoggedInUser = () => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  };

  const user = getLoggedInUser();
  const userId = user?.id;

  const fetchFertilizers = async () => {
    setIsLoading(true);
    setError("");
    try {
      const params = {
        size: 24,
        keyword: keyword || undefined,
        brand: brandFilter || undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined
      };
      const response = await api.get("/fertilizers/search", { params });
      setFertilizers(unwrapPage(response));
    } catch (err) {
      console.error("Failed to load fertilizer listings:", err);
      setError("Failed to fetch fertilizer listings.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchFertilizers();
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [keyword, brandFilter, maxPrice]);

  const handleResetFilters = () => {
    setKeyword("");
    setBrandFilter("");
    setMaxPrice("");
  };

  const handleAddToCart = async (fertilizer, quantity = 1, redirectToCart = false) => {
    if (!userId) {
      setError("Please log in to purchase fertilizers.");
      setTimeout(() => navigate("/account"), 1500);
      return;
    }

    setCartLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        productId: fertilizer.productId,
        quantity: quantity,
        cartId: 0
      };
      await api.post(`/cart/${userId}/items`, payload);
      
      setSuccess(`Successfully added ${quantity} unit(s) of ${fertilizer.productName} to your cart! 🛒`);
      
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-100/40 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-green-950 rounded-3xl p-6 md:p-10 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
          <div className="space-y-2 relative z-10 text-center md:text-left">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">Fertilizers Marketplace</h1>
            <p className="text-emerald-100 max-w-xl text-sm md:text-base font-bold">
              Boost your soil health and crop yields. Discover certified organic, chemical, and bio-fertilizers sourced from verified sellers and major brands.
            </p>
          </div>
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

        <div className="flex flex-col lg:flex-row gap-8 animate-fadeIn">
          
          {/* Sidebar Filters */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-3xl p-6 border border-green-100 shadow-md sticky top-6 space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <h3 className="font-black text-green-950 flex items-center gap-2">
                  <Filter size={18} className="text-emerald-600" />
                  Filter Listings
                </h3>
                {(keyword || brandFilter || maxPrice) && (
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
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="e.g. Urea, NPK, Organic"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                  />
                  <Search className="absolute left-3.5 top-3.5 text-gray-400" size={16} />
                </div>
              </div>

              {/* Brand filter */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">Brand Name</label>
                <input
                  type="text"
                  value={brandFilter}
                  onChange={(e) => setBrandFilter(e.target.value)}
                  placeholder="e.g. IFFCO, Tata"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                />
              </div>

              {/* Max Price limit */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">Max Price limit (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 1500"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="p-3 rounded-xl border border-gray-200 text-sm w-full text-center focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Marketplace Grid */}
          <div className="flex-grow">
            {isLoading ? (
              <div className="text-center py-24">
                <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400 font-bold">Scanning chemical & organic stock...</p>
              </div>
            ) : fertilizers.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-green-50 shadow-md">
                <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
                <h4 className="text-lg font-bold text-gray-700">No matching fertilizers found</h4>
                <p className="text-sm text-gray-400 mt-1">Try broadening your search keywords or adjusting your price limits.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {fertilizers.map((f) => {
                  const hasStock = f.quantity > 0;
                  return (
                    <div 
                      key={f.id} 
                      className="bg-white rounded-[32px] border border-gray-100 hover:border-emerald-300 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group h-full"
                    >
                      {/* Image banner */}
                      <div className="h-48 relative overflow-hidden bg-emerald-50">
                        <img
                          src={getPrimaryImage(f)}
                          alt={f.productName}
                          className="w-full h-full object-contain p-4 group-hover:scale-105 transition duration-500"
                        />
                        <span className="absolute top-4 left-4 bg-emerald-900/80 backdrop-blur-sm text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                          <Tag size={10} />
                          {f.brand || "General"}
                        </span>
                        
                        {hasStock ? (
                          <span className="absolute top-4 right-4 bg-green-500/90 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase">
                            In Stock
                          </span>
                        ) : (
                          <span className="absolute top-4 right-4 bg-red-500/90 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase">
                            Out of Stock
                          </span>
                        )}
                      </div>

                      {/* Description contents */}
                      <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <h3 className="text-lg font-black text-emerald-950 group-hover:text-emerald-700 transition duration-300">
                            {f.productName}
                          </h3>
                          
                          <p className="text-xs text-gray-400 font-bold line-clamp-2">
                            {f.description || "Premium agricultural fertilizer to boost organic soil nutrition and crop resistance."}
                          </p>

                          <div className="text-xs font-semibold text-gray-500 pt-1 flex flex-col gap-1">
                            <div>Seller: <strong className="text-gray-800 font-extrabold">{f.sellerBusinessName || "Local Merchant"}</strong></div>
                            {f.expiryDate && (
                              <div className="flex items-center gap-1 text-[11px] text-gray-400">
                                <Calendar size={12} /> Expiry: <strong className="text-gray-600">{new Date(f.expiryDate).toLocaleDateString()}</strong>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action section */}
                        <div className="pt-3 border-t border-gray-100 flex flex-col space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Market Price</span>
                            <div className="text-xl font-black text-emerald-700">
                              {formatPrice(f.price)}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => setSelectedFertilizer(f)}
                              className="py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-xs rounded-xl transition"
                            >
                              Batch Info
                            </button>
                            <button
                              disabled={!hasStock || cartLoading}
                              onClick={() => handleAddToCart(f, 1, false)}
                              className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 disabled:bg-gray-100 disabled:text-gray-400"
                            >
                              <ShoppingCart size={13} />
                              Add To Cart
                            </button>
                          </div>

                          <button
                            disabled={!hasStock || cartLoading}
                            onClick={() => handleAddToCart(f, 1, true)}
                            className="w-full py-2.5 bg-emerald-900 hover:bg-emerald-950 text-white font-black text-xs rounded-xl transition disabled:bg-gray-100 disabled:text-gray-400"
                          >
                            Buy Now
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

      {/* Detail Modal */}
      {selectedFertilizer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[32px] w-full max-w-xl shadow-2xl border border-gray-100 overflow-hidden animate-scaleUp">
            
            {/* Image Header */}
            <div className="h-64 relative bg-emerald-50 flex items-center justify-center">
              <img
                src={getPrimaryImage(selectedFertilizer)}
                alt={selectedFertilizer.productName}
                className="max-h-56 object-contain p-4"
              />
              <button
                onClick={() => setSelectedFertilizer(null)}
                className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition"
              >
                <X size={20} />
              </button>
              <div className="absolute bottom-4 left-6 bg-emerald-900/90 backdrop-blur-md px-4 py-2 rounded-2xl text-white font-black uppercase tracking-wider text-xs shadow-md">
                {selectedFertilizer.brand || "General Brand"}
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div>
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-black text-emerald-950">{selectedFertilizer.productName}</h3>
                  <div className="text-2xl font-black text-emerald-700">
                    {formatPrice(selectedFertilizer.price)}
                  </div>
                </div>
                {selectedFertilizer.sellerBusinessName && (
                  <p className="text-xs text-gray-400 font-bold mt-1">Distributed by: {selectedFertilizer.sellerBusinessName}</p>
                )}
              </div>

              {/* Grid specifics */}
              <div className="grid grid-cols-3 gap-4 bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100/30 text-xs font-semibold text-center">
                <div>
                  <span className="text-gray-400 block text-[9px] uppercase font-black">Stock Level</span>
                  <strong className="text-emerald-900 text-sm block mt-1">{selectedFertilizer.quantity} units</strong>
                </div>
                <div>
                  <span className="text-gray-400 block text-[9px] uppercase font-black">Mfg Date</span>
                  <strong className="text-emerald-900 text-sm block mt-1">
                    {selectedFertilizer.manufacturingDate ? new Date(selectedFertilizer.manufacturingDate).toLocaleDateString() : "N/A"}
                  </strong>
                </div>
                <div>
                  <span className="text-gray-400 block text-[9px] uppercase font-black">Expiry Date</span>
                  <strong className="text-emerald-900 text-sm block mt-1">
                    {selectedFertilizer.expiryDate ? new Date(selectedFertilizer.expiryDate).toLocaleDateString() : "N/A"}
                  </strong>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h4 className="font-black text-emerald-950 text-sm">Product Description</h4>
                <p className="text-sm text-gray-500 font-bold leading-relaxed">
                  {selectedFertilizer.description || "Certified fertilizer designed to replenish essential nutrients in soil, optimize biological processes and yield quality crop outcomes."}
                </p>
              </div>

              {/* Reviews Panel */}
              <div className="pt-6 border-t border-gray-100">
                <h4 className="font-black text-emerald-950 text-sm mb-4">Customer Reviews & Ratings</h4>
                <ReviewsTab productId={selectedFertilizer.productId || selectedFertilizer.id} />
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-gray-100 flex gap-4">
                <button
                  onClick={() => setSelectedFertilizer(null)}
                  className="px-5 py-3 border border-gray-200 hover:bg-gray-50 text-gray-600 font-black text-xs rounded-xl transition"
                >
                  Close
                </button>
                <button
                  disabled={selectedFertilizer.quantity <= 0 || cartLoading}
                  onClick={() => {
                    handleAddToCart(selectedFertilizer, 1, false);
                    setSelectedFertilizer(null);
                  }}
                  className="flex-grow py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                >
                  <ShoppingCart size={15} />
                  Add to Shopping Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
