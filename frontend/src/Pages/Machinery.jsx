import React, { useState, useEffect } from "react";
import api, { formatPrice, getPrimaryImage, unwrapPage } from "../services/api";
import {
  Search,
  ShoppingCart,
  Shield,
  Filter,
  RotateCcw,
  Sparkles,
  Compass,
  ArrowRightLeft,
  X,
  Bookmark,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import MachineryDetailModal from "../components/MachineryDetailModal";

export default function MachineryMarketplace() {
  const navigate = useNavigate();
  const location = useLocation();

  // Core listing states
  const [machineries, setMachineries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters
  const [keyword, setKeyword] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("ALL");
  const [state, setState] = useState("");
  const [condition, setCondition] = useState("");
  const [typeFilter, setTypeFilter] = useState(() => {
    return window.location.pathname === "/machinery-rental" ? "RENT" : "ALL";
  });

  useEffect(() => {
    if (location.pathname === "/machinery-rental") {
      setTypeFilter("RENT");
    } else if (location.pathname === "/machinery") {
      setTypeFilter("ALL");
    }
  }, [location.pathname]);
  const [maxPrice, setMaxPrice] = useState("");

  // Compare tray states
  const [compareList, setCompareList] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Detail Modal state
  const [selectedMachinery, setSelectedMachinery] = useState(null);
  const [cartLoading, setCartLoading] = useState(false);

  const getLoggedInUser = () => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  };

  const user = getLoggedInUser();
  const userId = user?.id;

  const fetchMachineryListings = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        size: 24,
        keyword: keyword || undefined,
        brand: brand || undefined,
        category: category !== "ALL" ? category : undefined,
        state: state || undefined,
        condition: condition || undefined,
        forSale: typeFilter === "SALE" ? true : undefined,
        forRent: typeFilter === "RENT" ? true : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined
      };
      const response = await api.get("/machinery/search", { params });
      setMachineries(unwrapPage(response));
    } catch (err) {
      console.error("Failed to load machinery listings:", err);
      setError("Failed to fetch machinery listings from repository.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchMachineryListings();
    }, 450);
    return () => clearTimeout(delayDebounceFn);
  }, [keyword, brand, category, state, condition, typeFilter, maxPrice]);

  const handleResetFilters = () => {
    setKeyword("");
    setBrand("");
    setCategory("ALL");
    setState("");
    setCondition("");
    setTypeFilter("ALL");
    setMaxPrice("");
  };

  const handleAddToCart = async (item) => {
    if (!userId) {
      setError("Please log in to purchase machinery.");
      setTimeout(() => navigate("/account"), 1500);
      return;
    }

    setCartLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        productId: item.productId,
        quantity: 1,
        cartId: 0
      };
      await api.post(`/cart/${userId}/items`, payload);
      setSuccess(`Successfully added 1 unit of ${item.productName} to your cart! 🛒`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Cart action failed:", err);
      setError(err.response?.data?.message || "Failed to update shopping cart.");
      setTimeout(() => setError(""), 3000);
    } finally {
      setCartLoading(false);
    }
  };

  // Compare machinery helper
  const handleToggleCompare = (item) => {
    if (compareList.some((c) => c.id === item.id)) {
      setCompareList(compareList.filter((c) => c.id !== item.id));
    } else {
      if (compareList.length >= 3) {
        setError("You can compare up to 3 machinery items side-by-side.");
        setTimeout(() => setError(""), 2500);
        return;
      }
      setCompareList([...compareList, item]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/40 via-white to-amber-50/20 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Banner Hero */}
        <div className="bg-gradient-to-r from-emerald-800 to-green-950 rounded-3xl p-6 md:p-10 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
          <div className="space-y-2 relative z-10 text-center md:text-left">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight flex items-center justify-center md:justify-start gap-2">
              <Compass className="animate-spin text-amber-400" size={36} />
              Farm Machinery
            </h1>
            <p className="text-amber-100 max-w-xl text-sm md:text-base font-bold">
              Explore professional agriculture machinery listings. Purchase models directly or request flexible hourly, daily, or weekly rental bookings.
            </p>
          </div>
          <div className="absolute right-0 bottom-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl"></div>
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

        {/* Main Grid Section */}
        <div className="flex flex-col lg:flex-row gap-8 animate-fadeIn">
          
          {/* Left: Filter Sidebar */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-3xl p-6 border border-green-100 shadow-md sticky top-6 space-y-6">
              
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <h3 className="font-black text-green-950 flex items-center gap-2">
                  <Filter size={18} className="text-amber-600" />
                  Filter Machinery
                </h3>
                {(keyword || brand || category !== "ALL" || state || condition || typeFilter !== "ALL" || maxPrice) && (
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
                <label className="text-xs font-black text-gray-500 uppercase tracking-wider pl-1">Search Keywords</label>
                <div className="relative">
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="e.g. Tractor, Seeder, Plough"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-green-500 transition text-gray-800"
                  />
                  <Search className="absolute left-3.5 top-3.5 text-gray-400" size={16} />
                </div>
              </div>

              {/* Category selector */}
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 uppercase tracking-wider pl-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-green-500 transition text-gray-800"
                >
                  <option value="ALL">All Categories</option>
                  <option value="Tractor">Tractor</option>
                  <option value="Rotavator">Rotavator</option>
                  <option value="Cultivator">Cultivator</option>
                  <option value="Harvester">Harvester</option>
                  <option value="Seeder">Seeder</option>
                  <option value="Plough">Plough</option>
                  <option value="Thresher">Thresher</option>
                  <option value="Sprayer">Sprayer</option>
                  <option value="Water Pump">Water Pump</option>
                  <option value="Power Tiller">Power Tiller</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Brand filter */}
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 uppercase tracking-wider pl-1">Brand Name</label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Mahindra, Kubota"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-green-500 transition text-gray-800"
                />
              </div>

              {/* Condition status */}
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 uppercase tracking-wider pl-1">Condition</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-green-500 transition text-gray-800"
                >
                  <option value="">All Conditions</option>
                  <option value="New">New</option>
                  <option value="Used">Used</option>
                  <option value="Refurbished">Refurbished</option>
                </select>
              </div>

              {/* Option Mode */}
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 uppercase tracking-wider pl-1">Option Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-green-500 transition text-gray-800"
                >
                  <option value="ALL">For Sale & Rent</option>
                  <option value="SALE">Only Buy Now</option>
                  <option value="RENT">Only Rent Now</option>
                </select>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 uppercase tracking-wider pl-1">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Maharashtra, Punjab"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-green-500 transition text-gray-800"
                />
              </div>

              {/* Price Range */}
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 uppercase tracking-wider pl-1">Max Price Limit (₹)</label>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="e.g. 500000"
                  className="p-3 rounded-xl border border-gray-200 text-sm w-full text-center focus:ring-2 focus:ring-green-500 transition text-gray-800"
                />
              </div>

            </div>
          </div>

          {/* Right: Products List Grid */}
          <div className="flex-grow">
            {loading ? (
              <div className="text-center py-24">
                <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400 font-bold">Scanning machinery listings...</p>
              </div>
            ) : machineries.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-green-50 shadow-md">
                <Compass size={48} className="mx-auto text-gray-300 mb-4" />
                <h4 className="text-lg font-bold text-gray-700">No machinery listings found</h4>
                <p className="text-sm text-gray-400 mt-1">Try broadening your search keywords or adjusting parameters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {machineries.map((item) => {
                  const hasStock = item.quantityAvailable > 0;
                  const isCompared = compareList.some((c) => c.id === item.id);
                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-[32px] border border-gray-100 hover:border-emerald-300 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group relative h-full"
                    >
                      
                      {/* Image Frame */}
                      <div className="h-48 relative overflow-hidden bg-green-50/10 flex items-center justify-center">
                        <img
                          src={getPrimaryImage(item)}
                          alt={item.productName}
                          className="max-h-40 object-contain p-4 group-hover:scale-105 transition duration-500"
                        />
                        
                        <span className="absolute top-4 left-4 bg-green-900/80 backdrop-blur-sm text-white text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider">
                          {item.brandName}
                        </span>

                        <div className="absolute top-4 right-4 flex flex-col gap-1 items-end">
                          {item.availableForSale && (
                            <span className="bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase">
                              Sale
                            </span>
                          )}
                          {item.availableForRent && (
                            <span className="bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase">
                              Rent
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Info Contents */}
                      <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <h3 className="text-base font-black text-green-950 group-hover:text-emerald-700 transition duration-300">
                              {item.productName}
                            </h3>
                            <span className="bg-emerald-50 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0">
                              {item.conditionStatus}
                            </span>
                          </div>

                          <p className="text-xs text-gray-400 font-bold line-clamp-2">
                            {item.description || "Fully inspected agricultural machinery, certified by Smart Krishi experts."}
                          </p>

                          <div className="text-[11px] font-semibold text-gray-500 pt-1 flex flex-col gap-0.5">
                            <div>Location: <strong className="text-gray-700">{item.district ? `${item.district}, ${item.state}` : "Local Yard"}</strong></div>
                            <div>Power: <strong className="text-gray-700">{item.powerHp ? `${item.powerHp} HP` : "N/A"}</strong></div>
                          </div>
                        </div>

                        {/* Cost & Actions */}
                        <div className="pt-3 border-t border-gray-100 flex flex-col space-y-3">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-gray-400 uppercase tracking-wider">Rates</span>
                            <div className="text-right">
                              {item.availableForSale && (
                                <div className="font-black text-amber-600">
                                  {formatPrice(item.price)}
                                </div>
                              )}
                              {item.availableForRent && (
                                <div className="font-bold text-blue-700 text-[11px]">
                                  Rent: <span className="font-black">{formatPrice(item.rentPerDay)}</span>/day
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => setSelectedMachinery(item)}
                              className="py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-[11px] rounded-xl transition"
                            >
                              Details & Book
                            </button>
                            {item.availableForSale ? (
                              <button
                                disabled={!hasStock || cartLoading}
                                onClick={() => handleAddToCart(item)}
                                className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] rounded-xl shadow-sm transition flex items-center justify-center gap-1"
                              >
                                <ShoppingCart size={12} />
                                Buy Now
                              </button>
                            ) : (
                              <button
                                onClick={() => setSelectedMachinery(item)}
                                className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] rounded-xl shadow-sm transition"
                              >
                                Book Rental
                              </button>
                            )}
                          </div>

                          {/* Compare trigger */}
                          <button
                            onClick={() => handleToggleCompare(item)}
                            className={`w-full py-1.5 border rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition ${
                              isCompared 
                                ? "bg-amber-50 text-amber-800 border-amber-300" 
                                : "bg-white text-gray-400 hover:text-emerald-700 border-gray-200"
                            }`}
                          >
                            <ArrowRightLeft size={11} />
                            {isCompared ? "Compared" : "Add to Compare"}
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

      {/* Compare Floating Tray */}
      {compareList.length > 0 && (
        <div className="fixed bottom-6 right-6 left-6 md:left-auto md:w-80 bg-white rounded-3xl border border-amber-200 shadow-2xl p-4 z-40 animate-slideUp">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <h4 className="font-black text-green-950 text-xs flex items-center gap-1.5">
              <ArrowRightLeft size={14} className="text-amber-500 animate-pulse" />
              Compare Items ({compareList.length}/3)
            </h4>
            <button
              onClick={() => setCompareList([])}
              className="text-xs text-red-500 font-bold hover:underline"
            >
              Clear
            </button>
          </div>
          <div className="flex gap-2 py-3 overflow-x-auto">
            {compareList.map((c) => (
              <div key={c.id} className="relative w-16 h-16 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center p-1 group">
                <img src={getPrimaryImage(c)} className="max-h-12 max-w-12 object-contain" alt="" />
                <button
                  onClick={() => handleToggleCompare(c)}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowCompareModal(true)}
            className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl shadow-md transition"
          >
            Compare Specifications Now
          </button>
        </div>
      )}

      {/* Compare Specifications Side-by-Side Modal */}
      {showCompareModal && (
        <div className="fixed inset-0 bg-green-950/45 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-4xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[85vh] animate-scaleUp">
            
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-green-900 text-white">
              <h3 className="text-lg font-black flex items-center gap-2">
                <ArrowRightLeft size={20} className="text-amber-400" />
                Farming Machinery Comparison
              </h3>
              <button
                onClick={() => setShowCompareModal(false)}
                className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-auto flex-grow">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-3 px-4 font-black text-gray-400 uppercase w-1/4">Specs Key</th>
                    {compareList.map((c) => (
                      <th key={c.id} className="py-3 px-4 text-center font-black text-green-950 w-1/4">
                        <img src={getPrimaryImage(c)} className="h-16 object-contain mx-auto mb-2" alt="" />
                        <span className="block text-sm font-extrabold">{c.productName}</span>
                        <span className="text-[10px] text-gray-400 uppercase block">{c.brandName}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-semibold text-green-900">
                  <tr>
                    <td className="py-3 px-4 font-black text-gray-500">Category</td>
                    {compareList.map((c) => <td key={c.id} className="py-3 px-4 text-center">{c.machineryType}</td>)}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-black text-gray-500">Condition</td>
                    {compareList.map((c) => <td key={c.id} className="py-3 px-4 text-center">{c.conditionStatus}</td>)}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-black text-gray-500">Horsepower</td>
                    {compareList.map((c) => <td key={c.id} className="py-3 px-4 text-center">{c.powerHp ? `${c.powerHp} HP` : "N/A"}</td>)}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-black text-gray-500">Fuel/Engine Type</td>
                    {compareList.map((c) => <td key={c.id} className="py-3 px-4 text-center">{c.fuelType || c.engineType || "Diesel"}</td>)}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-black text-gray-500">Working Width</td>
                    {compareList.map((c) => <td key={c.id} className="py-3 px-4 text-center">{c.workingWidth || "N/A"}</td>)}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-black text-gray-500">Weight</td>
                    {compareList.map((c) => <td key={c.id} className="py-3 px-4 text-center">{c.weight || "N/A"}</td>)}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-black text-gray-500">Sale Price</td>
                    {compareList.map((c) => <td key={c.id} className="py-3 px-4 text-center font-black text-amber-600">{c.availableForSale ? formatPrice(c.price) : "Rent Only"}</td>)}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-black text-gray-500">Rent / Day</td>
                    {compareList.map((c) => <td key={c.id} className="py-3 px-4 text-center font-black text-blue-600">{c.availableForRent ? `${formatPrice(c.rentPerDay)}/day` : "Buy Only"}</td>)}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-black text-gray-500">Security Deposit</td>
                    {compareList.map((c) => <td key={c.id} className="py-3 px-4 text-center font-black">{c.securityDeposit ? formatPrice(c.securityDeposit) : "N/A"}</td>)}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-black text-gray-500">Location</td>
                    {compareList.map((c) => <td key={c.id} className="py-3 px-4 text-center">{c.district}, {c.state}</td>)}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
              <button
                onClick={() => setShowCompareModal(false)}
                className="px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-600 font-black text-xs rounded-xl transition"
              >
                Close Comparison
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Machinery Detail Modal */}
      {selectedMachinery && (
        <MachineryDetailModal
          machinery={selectedMachinery}
          onClose={() => setSelectedMachinery(null)}
          onAddToCart={handleAddToCart}
        />
      )}

    </div>
  );
}
