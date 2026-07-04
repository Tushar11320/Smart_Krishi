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
  Truck,
  Sparkles,
  Layers,
  Compass,
  ArrowRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import ReviewsTab from "../components/ReviewsTab";

export default function BuildingMaterials() {
  const navigate = useNavigate();
  
  // Marketplace list & load states
  const [materials, setMaterials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState(""); // Cement, Bricks, Sand, Stone, Iron Rods, Pipes, Other
  const [deliveryFilter, setDeliveryFilter] = useState(false);
  const [maxPrice, setMaxPrice] = useState("");

  // Modal & Add to Cart feedback states
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [quantityToBuy, setQuantityToBuy] = useState(1);
  const [cartLoading, setCartLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const getLoggedInUser = () => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  };

  const user = getLoggedInUser();
  const userId = user?.id;

  const fetchMaterials = async () => {
    setIsLoading(true);
    setError("");
    try {
      const params = {
        size: 24,
        keyword: keyword || undefined,
        materialType: typeFilter || undefined,
        deliveryAvailable: deliveryFilter ? true : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined
      };
      const response = await api.get("/materials/search", { params });
      setMaterials(unwrapPage(response));
    } catch (err) {
      console.error("Failed to load building materials:", err);
      setError("Failed to fetch building materials.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchMaterials();
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [keyword, typeFilter, deliveryFilter, maxPrice]);

  const handleResetFilters = () => {
    setKeyword("");
    setTypeFilter("");
    setDeliveryFilter(false);
    setMaxPrice("");
  };

  const handleAddToCart = async (material, quantity = 1, redirectToCart = false) => {
    if (!userId) {
      setError("Please log in to purchase building materials.");
      setTimeout(() => navigate("/account"), 1500);
      return;
    }

    setCartLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        productId: material.productId,
        quantity: quantity,
        cartId: 0
      };
      await api.post(`/cart/${userId}/items`, payload);
      
      setSuccess(`Successfully added ${quantity} ${material.unit || "units"} of ${material.productName} to your cart! 🛒`);
      
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-slate-100 p-4 md:p-8 animate-fadeIn">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Page Banner Header */}
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-[32px] p-6 md:p-10 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
          <div className="space-y-2 relative z-10 text-center md:text-left">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight flex items-center justify-center md:justify-start gap-3">
              <Layers className="text-indigo-400 animate-pulse" size={36} />
              Building Materials
            </h1>
            <p className="text-indigo-100 max-w-xl text-sm md:text-base font-medium">
              Source high-quality bricks, cement, aggregate sand, pipes, and iron rods directly from local suppliers and verified dealers.
            </p>
          </div>
          <div className="absolute right-0 bottom-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
        </div>

        {/* Global Action Feedbacks */}
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
          
          {/* Sidebar Search & Filtering Controls */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-md sticky top-6 space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <h3 className="font-black text-slate-900 flex items-center gap-2">
                  <Filter size={18} className="text-indigo-600" />
                  Filters
                </h3>
                {(keyword || typeFilter || deliveryFilter || maxPrice) && (
                  <button 
                    onClick={handleResetFilters}
                    className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1 transition"
                  >
                    <RotateCcw size={12} /> Reset All
                  </button>
                )}
              </div>

              {/* Keyword text search */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider pl-1">Search Keywords</label>
                <div className="relative">
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="e.g. Portland Cement, PVC"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  />
                  <Search className="absolute left-3.5 top-3.5 text-gray-400" size={16} />
                </div>
              </div>

              {/* Material Type Selection */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider pl-1">Material Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-indigo-500 transition"
                >
                  <option value="">All Materials</option>
                  <option value="Cement">Cement</option>
                  <option value="Bricks">Bricks</option>
                  <option value="Sand">Sand</option>
                  <option value="Stone">Stone</option>
                  <option value="Iron Rods">Iron Rods</option>
                  <option value="Pipes">Pipes</option>
                  <option value="Other">Other Materials</option>
                </select>
              </div>

              {/* Max Budget Limit */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider pl-1">Max Price Limit (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="p-3 rounded-xl border border-gray-200 text-sm w-full text-center focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              {/* Delivery Availability Toggle */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="delivery-filter"
                  checked={deliveryFilter}
                  onChange={(e) => setDeliveryFilter(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-gray-200 rounded focus:ring-indigo-500"
                />
                <label htmlFor="delivery-filter" className="text-xs font-bold text-gray-700 cursor-pointer">
                  Delivery Available
                </label>
              </div>
            </div>
          </div>

          {/* Material Marketplace Catalog List */}
          <div className="flex-grow">
            {isLoading ? (
              <div className="text-center py-24">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400 font-extrabold">Loading material stocks...</p>
              </div>
            ) : materials.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-[32px] border border-gray-100 shadow-md">
                <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
                <h4 className="text-lg font-black text-slate-700">No building materials found</h4>
                <p className="text-sm text-gray-400 mt-1">Try broadening your search keywords or adjusting filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {materials.map((item) => {
                  const isAvailable = item.quantity > 0;
                  return (
                    <div 
                      key={item.id} 
                      className="bg-white rounded-[32px] border border-slate-100 hover:border-indigo-300 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group"
                    >
                      {/* Image header */}
                      <div className="h-48 relative overflow-hidden bg-slate-50 flex items-center justify-center">
                        <img
                          src={getPrimaryImage(item)}
                          alt={item.productName}
                          className="max-h-40 object-contain p-4 group-hover:scale-105 transition duration-500"
                        />
                        <span className="absolute top-4 left-4 bg-indigo-950/80 backdrop-blur-sm text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider">
                          {item.materialType}
                        </span>
                        {item.deliveryAvailable && (
                          <span className="absolute bottom-4 right-4 bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                            <Truck size={12} /> Delivery
                          </span>
                        )}
                      </div>

                      {/* Content details */}
                      <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-700 transition duration-300">
                            {item.productName}
                          </h3>
                          
                          <p className="text-xs text-gray-400 font-bold line-clamp-2">
                            {item.description || "Premium quality building materials sourced directly from local verified dealers."}
                          </p>

                          <div className="text-[11px] font-bold text-gray-500 pt-1 flex flex-col gap-0.5">
                            <div>Merchant: <strong className="text-slate-800 font-extrabold">{item.sellerBusinessName || "SmartKrishi Dealer"}</strong></div>
                            <div>Stock: <strong className={isAvailable ? "text-green-600" : "text-red-500"}>
                              {isAvailable ? `${item.quantity} ${item.unit || "units"}` : "Out of Stock"}
                            </strong></div>
                          </div>
                        </div>

                        {/* Price and CTA */}
                        <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Rate / {item.unit || "unit"}</span>
                            <span className="text-lg font-black text-indigo-700">{formatPrice(item.price)}</span>
                          </div>
                          
                          <button
                            onClick={() => {
                              setSelectedMaterial(item);
                              setQuantityToBuy(1);
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition shadow-md shadow-indigo-100 flex items-center gap-1"
                          >
                            Buy Material <ArrowRight size={13} />
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

      {/* Details / Checkout Modal */}
      {selectedMaterial && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden animate-scaleUp">
            
            {/* Modal Image Header */}
            <div className="h-56 relative bg-indigo-50/20 flex items-center justify-center">
              <img
                src={getPrimaryImage(selectedMaterial)}
                alt={selectedMaterial.productName}
                className="max-h-48 object-contain p-4"
              />
              <button
                onClick={() => setSelectedMaterial(null)}
                className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition"
              >
                <X size={20} />
              </button>
              <div className="absolute bottom-4 left-6 bg-indigo-950/90 backdrop-blur-md px-4 py-2 rounded-2xl text-white font-black uppercase tracking-wider text-[10px] shadow-md">
                {selectedMaterial.materialType}
              </div>
            </div>

            {/* Modal Contents */}
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div>
                <h3 className="text-2xl font-black text-slate-900">{selectedMaterial.productName}</h3>
                <p className="text-xs text-gray-400 font-bold mt-1">
                  Listed by supplier: {selectedMaterial.sellerBusinessName || "SmartKrishi Partner"}
                </p>
              </div>

              {/* Specifications pills */}
              <div className="grid grid-cols-3 gap-2 bg-indigo-50/30 p-3.5 rounded-2xl border border-indigo-100/30 text-xs font-bold text-center text-slate-800">
                <div>
                  <span className="text-[9px] uppercase font-black text-gray-400 block mb-0.5">Rate / {selectedMaterial.unit || "unit"}</span>
                  {formatPrice(selectedMaterial.price)}
                </div>
                <div>
                  <span className="text-[9px] uppercase font-black text-gray-400 block mb-0.5">In Stock</span>
                  {selectedMaterial.quantity} {selectedMaterial.unit || "units"}
                </div>
                <div>
                  <span className="text-[9px] uppercase font-black text-gray-400 block mb-0.5">Delivery</span>
                  {selectedMaterial.deliveryAvailable ? "Yes" : "Pickup Only"}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">Description</h4>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">
                  {selectedMaterial.description || "Premium quality build implement configured for commercial and general agricultural builds. Inspected for quality standards."}
                </p>
              </div>

              {/* Reviews Panel */}
              <div className="pt-6 border-t border-gray-100">
                <h4 className="font-black text-slate-900 text-sm mb-4">Customer Reviews & Ratings</h4>
                <ReviewsTab productId={selectedMaterial.productId || selectedMaterial.id} />
              </div>

              {/* Quantity selectors */}
              {selectedMaterial.quantity > 0 && (
                <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-2xl p-4">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-800">Select Order Quantity</span>
                    <span className="text-[10px] font-bold text-gray-400">Specify quantity in {selectedMaterial.unit || "units"}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 bg-white border border-gray-200 px-3 py-1.5 rounded-xl shadow-sm">
                    <button
                      onClick={() => setQuantityToBuy(prev => Math.max(1, prev - 1))}
                      className="w-8 h-8 rounded-lg bg-slate-50 border border-gray-100 font-black text-slate-600 hover:bg-slate-100 transition"
                    >
                      -
                    </button>
                    <span className="font-extrabold text-slate-900 w-8 text-center">{quantityToBuy}</span>
                    <button
                      onClick={() => setQuantityToBuy(prev => Math.min(selectedMaterial.quantity, prev + 1))}
                      className="w-8 h-8 rounded-lg bg-slate-50 border border-gray-100 font-black text-slate-600 hover:bg-slate-100 transition"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Purchase action CTAs */}
              <div className="pt-2 flex gap-4">
                <button
                  onClick={() => setSelectedMaterial(null)}
                  className="px-5 py-3.5 border border-gray-200 hover:bg-gray-50 text-gray-600 font-black text-xs rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  disabled={selectedMaterial.quantity <= 0 || cartLoading}
                  onClick={() => {
                    handleAddToCart(selectedMaterial, quantityToBuy, false);
                    setSelectedMaterial(null);
                  }}
                  className="flex-grow py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                >
                  <ShoppingCart size={15} />
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
