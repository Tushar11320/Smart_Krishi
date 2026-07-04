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
  Clock,
  Compass,
  Sparkles,
  ShieldAlert,
  Info
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import ReviewsTab from "../components/ReviewsTab";

export default function FarmingEquipmentMarketplace() {
  const navigate = useNavigate();
  
  // Marketplace states
  const [equipments, setEquipments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [conditionFilter, setConditionFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL"); // ALL, SALE, RENT
  const [maxPrice, setMaxPrice] = useState("");

  // Detail Modal & Action feedback states
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [equipmentBookings, setEquipmentBookings] = useState([]);
  const [rentStartDate, setRentStartDate] = useState("");
  const [rentEndDate, setRentEndDate] = useState("");
  
  const [cartLoading, setCartLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const getLoggedInUser = () => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  };

  const user = getLoggedInUser();
  const userId = user?.id;

  const fetchEquipments = async () => {
    setIsLoading(true);
    setError("");
    try {
      const params = {
        size: 24,
        keyword: keyword || undefined,
        brand: brandFilter || undefined,
        condition: conditionFilter || undefined,
        forSale: typeFilter === "SALE" ? true : undefined,
        forRent: typeFilter === "RENT" ? true : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined
      };
      const response = await api.get("/equipments/search", { params });
      setEquipments(unwrapPage(response));
    } catch (err) {
      console.error("Failed to load equipment listings:", err);
      setError("Failed to fetch equipment listings.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch bookings for the selected equipment to show availability calendar slots
  const fetchEquipmentBookings = async (equipmentId) => {
    try {
      const res = await api.get(`/equipments/bookings/equipment/${equipmentId}`);
      setEquipmentBookings(res.data?.data || res.data || []);
    } catch (err) {
      console.error("Failed to load active booked slots:", err);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchEquipments();
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [keyword, brandFilter, conditionFilter, typeFilter, maxPrice]);

  useEffect(() => {
    if (selectedEquipment) {
      fetchEquipmentBookings(selectedEquipment.id);
      setRentStartDate("");
      setRentEndDate("");
    } else {
      setEquipmentBookings([]);
    }
  }, [selectedEquipment]);

  const handleResetFilters = () => {
    setKeyword("");
    setBrandFilter("");
    setConditionFilter("");
    setTypeFilter("ALL");
    setMaxPrice("");
  };

  const handleAddToCart = async (equipment, quantity = 1, redirectToCart = false) => {
    if (!userId) {
      setError("Please log in to purchase farming equipment.");
      setTimeout(() => navigate("/account"), 1500);
      return;
    }

    setCartLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        productId: equipment.productId,
        quantity: quantity,
        cartId: 0
      };
      await api.post(`/cart/${userId}/items`, payload);
      
      setSuccess(`Successfully added ${quantity} unit(s) of ${equipment.productName} to your cart! 🛒`);
      
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

  const handleBookRental = async (e) => {
    e.preventDefault();
    if (!userId) {
      setError("Please log in to rent equipment.");
      setTimeout(() => navigate("/account"), 1500);
      return;
    }

    if (!rentStartDate || !rentEndDate) {
      setError("Please select both start and end rental dates.");
      return;
    }

    setBookingLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        farmingEquipmentId: selectedEquipment.id,
        buyerId: userId,
        startDate: rentStartDate,
        endDate: rentEndDate,
        bookingStatus: "PENDING"
      };

      await api.post("/equipments/rent", payload);
      setSuccess("Rental slot booked successfully! Seller notification sent. 🚜");
      setSelectedEquipment(null);
    } catch (err) {
      console.error("Booking failed:", err);
      setError(err.response?.data?.message || "Selected date range overlaps with an existing booking.");
    } finally {
      setBookingLoading(false);
    }
  };

  // Rent Calculation
  const calculateRentalTotal = () => {
    if (!rentStartDate || !rentEndDate || !selectedEquipment) return null;
    const start = new Date(rentStartDate);
    const end = new Date(rentEndDate);
    if (start > end) return null;
    
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    const dailyPrice = selectedEquipment.rentPerDay || 0;
    const security = selectedEquipment.securityDeposit || 0;
    const totalRent = dailyPrice * diffDays;
    
    return {
      days: diffDays,
      rentPrice: totalRent,
      securityDeposit: security,
      totalCost: totalRent + security
    };
  };

  const costBreakdown = calculateRentalTotal();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-green-100/40 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Banner */}
        <div className="bg-gradient-to-r from-amber-600 to-green-950 rounded-3xl p-6 md:p-10 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
          <div className="space-y-2 relative z-10 text-center md:text-left">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight flex items-center justify-center md:justify-start gap-2">
              <Compass className="animate-spin text-amber-400" size={36} />
              Farming Equipment
            </h1>
            <p className="text-amber-100 max-w-xl text-sm md:text-base font-bold">
              Own or rent high-performance farm implements. Check live schedule calendars to rent tractors, seeders, or harvesters by day/hour.
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

        <div className="flex flex-col lg:flex-row gap-8 animate-fadeIn">
          
          {/* Sidebar Filters */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-3xl p-6 border border-green-100 shadow-md sticky top-6 space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <h3 className="font-black text-green-950 flex items-center gap-2">
                  <Filter size={18} className="text-amber-600" />
                  Filter Equipment
                </h3>
                {(keyword || brandFilter || conditionFilter || typeFilter !== "ALL" || maxPrice) && (
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
                    placeholder="e.g. Tractor, Seeder"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                  />
                  <Search className="absolute left-3.5 top-3.5 text-gray-400" size={16} />
                </div>
              </div>

              {/* Brand filter */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">Brand</label>
                <input
                  type="text"
                  value={brandFilter}
                  onChange={(e) => setBrandFilter(e.target.value)}
                  placeholder="e.g. Mahindra, Kubota"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-amber-500 transition"
                />
              </div>

              {/* Condition Filter */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">Equipment Condition</label>
                <select
                  value={conditionFilter}
                  onChange={(e) => setConditionFilter(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-amber-500 transition"
                >
                  <option value="">All Conditions</option>
                  <option value="NEW">New</option>
                  <option value="EXCELLENT">Excellent</option>
                  <option value="GOOD">Good</option>
                  <option value="FAIR">Fair</option>
                </select>
              </div>

              {/* Option Type Filter */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">Available Option</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-amber-500 transition"
                >
                  <option value="ALL">For Sale & Rent</option>
                  <option value="SALE">Only For Sale</option>
                  <option value="RENT">Only For Rent</option>
                </select>
              </div>

              {/* Max Price limit */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">Max price limit (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 100000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="p-3 rounded-xl border border-gray-200 text-sm w-full text-center focus:ring-2 focus:ring-amber-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Marketplace Grid */}
          <div className="flex-grow">
            {isLoading ? (
              <div className="text-center py-24">
                <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400 font-bold">Scanning active fleet listings...</p>
              </div>
            ) : equipments.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-green-50 shadow-md">
                <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
                <h4 className="text-lg font-bold text-gray-700">No equipment found</h4>
                <p className="text-sm text-gray-400 mt-1">Try broadening your search keywords or adjusting condition parameters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {equipments.map((eq) => {
                  const hasStock = eq.quantity > 0;
                  return (
                    <div 
                      key={eq.id} 
                      className="bg-white rounded-[32px] border border-gray-100 hover:border-amber-300 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group"
                    >
                      {/* Image banner */}
                      <div className="h-48 relative overflow-hidden bg-amber-50/30 flex items-center justify-center">
                        <img
                          src={getPrimaryImage(eq)}
                          alt={eq.productName}
                          className="max-h-40 object-contain p-4 group-hover:scale-105 transition duration-500"
                        />
                        <span className="absolute top-4 left-4 bg-green-900/80 backdrop-blur-sm text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider">
                          {eq.brand} {eq.model}
                        </span>
                        
                        <div className="absolute top-4 right-4 flex flex-col gap-1.5 items-end">
                          {eq.forSale && (
                            <span className="bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase">
                              For Sale
                            </span>
                          )}
                          {eq.forRent && (
                            <span className="bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase">
                              For Rent
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Description contents */}
                      <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <h3 className="text-lg font-black text-green-950 group-hover:text-amber-700 transition duration-300">
                              {eq.productName}
                            </h3>
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                              {eq.equipmentCondition}
                            </span>
                          </div>
                          
                          <p className="text-xs text-gray-400 font-bold line-clamp-2">
                            {eq.description || "Robust high-quality agricultural implement, serviced and checked for field performance."}
                          </p>

                          <div className="text-[11px] font-semibold text-gray-500 pt-1 flex flex-col gap-0.5">
                            <div>Owner: <strong className="text-gray-800 font-extrabold">{eq.sellerBusinessName || "SmartKrishi Partner"}</strong></div>
                            <div>Mfg Year: <strong className="text-gray-700">{eq.purchaseYear || "N/A"}</strong></div>
                          </div>
                        </div>

                        {/* Action section */}
                        <div className="pt-3 border-t border-gray-100 flex flex-col space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pricing Options</span>
                            <div className="text-right">
                              {eq.forSale && (
                                <div className="text-sm font-black text-amber-600">
                                  Sale: {formatPrice(eq.price)}
                                </div>
                              )}
                              {eq.forRent && (
                                <div className="text-xs font-bold text-blue-700">
                                  Rent: <span className="text-sm font-black">{formatPrice(eq.rentPerDay)}</span>/day
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => setSelectedEquipment(eq)}
                              className="py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-xs rounded-xl transition"
                            >
                              Check Calendar
                            </button>
                            {eq.forSale ? (
                              <button
                                disabled={!hasStock || cartLoading}
                                onClick={() => handleAddToCart(eq, 1, false)}
                                className="py-2.5 bg-green-600 hover:bg-green-700 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 disabled:bg-gray-100 disabled:text-gray-400"
                              >
                                <ShoppingCart size={13} />
                                Buy Now
                              </button>
                            ) : (
                              <button
                                onClick={() => setSelectedEquipment(eq)}
                                className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md transition"
                              >
                                Book Rental
                              </button>
                            )}
                          </div>
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
      {selectedEquipment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl border border-gray-100 overflow-hidden animate-scaleUp">
            
            {/* Image Header */}
            <div className="h-56 relative bg-amber-50/20 flex items-center justify-center">
              <img
                src={getPrimaryImage(selectedEquipment)}
                alt={selectedEquipment.productName}
                className="max-h-48 object-contain p-4"
              />
              <button
                onClick={() => setSelectedEquipment(null)}
                className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition"
              >
                <X size={20} />
              </button>
              <div className="absolute bottom-4 left-6 bg-green-900/90 backdrop-blur-md px-4 py-2 rounded-2xl text-white font-black uppercase tracking-wider text-xs shadow-md">
                {selectedEquipment.brand} {selectedEquipment.model}
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div>
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-black text-green-950">{selectedEquipment.productName}</h3>
                  <div className="text-right">
                    {selectedEquipment.forSale && (
                      <div className="text-xl font-black text-amber-600">{formatPrice(selectedEquipment.price)}</div>
                    )}
                    {selectedEquipment.forRent && (
                      <div className="text-xs text-gray-500 font-bold">
                        Rent: <span className="text-base font-black text-blue-700">{formatPrice(selectedEquipment.rentPerDay)}</span>/day
                      </div>
                    )}
                  </div>
                </div>
                {selectedEquipment.sellerBusinessName && (
                  <p className="text-xs text-gray-400 font-bold mt-1">Listed by owner: {selectedEquipment.sellerBusinessName}</p>
                )}
              </div>

              {/* Grid specifics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-green-50/30 p-4 rounded-2xl border border-green-100/30 text-xs font-semibold text-center">
                <div>
                  <span className="text-gray-400 block text-[9px] uppercase font-black">Brand</span>
                  <strong className="text-green-900 text-sm block mt-1">{selectedEquipment.brand}</strong>
                </div>
                <div>
                  <span className="text-gray-400 block text-[9px] uppercase font-black">Mfg Year</span>
                  <strong className="text-green-900 text-sm block mt-1">{selectedEquipment.purchaseYear || "N/A"}</strong>
                </div>
                <div>
                  <span className="text-gray-400 block text-[9px] uppercase font-black">Condition</span>
                  <strong className="text-green-900 text-sm block mt-1">{selectedEquipment.equipmentCondition}</strong>
                </div>
                <div>
                  <span className="text-gray-400 block text-[9px] uppercase font-black">Available</span>
                  <strong className="text-green-900 text-sm block mt-1">{selectedEquipment.quantity} units</strong>
                </div>
              </div>

              {/* Booking Availability Calendar Display */}
              {selectedEquipment.forRent && (
                <div className="space-y-4 p-5 border border-blue-100 rounded-3xl bg-blue-50/30">
                  <h4 className="font-black text-green-950 text-sm flex items-center gap-1.5">
                    <Calendar size={16} className="text-blue-600" />
                    Availability Calendar Slots
                  </h4>

                  {/* Reserved Slots */}
                  <div className="text-xs font-semibold space-y-2">
                    <span className="text-gray-400 block text-[10px] uppercase font-black">Currently Booked Slots</span>
                    {equipmentBookings.length === 0 ? (
                      <p className="text-green-700 italic font-bold">All dates are available! Go ahead and rent.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {equipmentBookings.map((b) => (
                          <div 
                            key={b.id} 
                            className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-800 flex items-center gap-1.5 font-bold"
                          >
                            <ShieldAlert size={12} className="text-red-500" />
                            {new Date(b.startDate).toLocaleDateString()} to {new Date(b.endDate).toLocaleDateString()}
                            <span className="text-[9px] uppercase bg-red-200 px-1.5 py-0.5 rounded text-red-900">Booked</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Book slots date range inputs */}
                  <form onSubmit={handleBookRental} className="grid grid-cols-2 gap-3 pt-3 border-t border-blue-100/50">
                    <div className="flex flex-col">
                      <label className="text-[10px] font-black uppercase text-gray-500 mb-1 pl-1">Start Date</label>
                      <input 
                        type="date" 
                        required
                        value={rentStartDate}
                        onChange={(e) => setRentStartDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        className="p-3 border border-gray-200 rounded-xl text-xs bg-white" 
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[10px] font-black uppercase text-gray-500 mb-1 pl-1">End Date</label>
                      <input 
                        type="date" 
                        required
                        value={rentEndDate}
                        onChange={(e) => setRentEndDate(e.target.value)}
                        min={rentStartDate || new Date().toISOString().split("T")[0]}
                        className="p-3 border border-gray-200 rounded-xl text-xs bg-white" 
                      />
                    </div>

                    {/* Cost breakdown summary */}
                    {costBreakdown && (
                      <div className="col-span-2 p-4 bg-green-50 border border-green-200 rounded-2xl space-y-1.5 text-xs text-green-900 font-semibold animate-fadeIn mt-2">
                        <div className="flex justify-between">
                          <span>Rental duration:</span>
                          <strong>{costBreakdown.days} day(s)</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Rate calculation ({formatPrice(selectedEquipment.rentPerDay)} x {costBreakdown.days}):</span>
                          <strong>{formatPrice(costBreakdown.rentPrice)}</strong>
                        </div>
                        {selectedEquipment.securityDeposit > 0 && (
                          <div className="flex justify-between">
                            <span>Security deposit (Refundable):</span>
                            <strong>{formatPrice(costBreakdown.securityDeposit)}</strong>
                          </div>
                        )}
                        <div className="flex justify-between border-t border-green-200 pt-2 font-black text-sm text-green-950 mt-1">
                          <span>Total Payment:</span>
                          <span>{formatPrice(costBreakdown.totalCost)}</span>
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={bookingLoading}
                      className="col-span-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white font-black text-xs rounded-xl shadow-lg transition mt-2 flex items-center justify-center gap-2"
                    >
                      {bookingLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                      Request Rental Reservation
                    </button>
                  </form>
                </div>
              )}

              {/* Purchase Description */}
              <div className="space-y-2">
                <h4 className="font-black text-green-950 text-sm">Description</h4>
                <p className="text-sm text-gray-500 font-bold leading-relaxed">
                  {selectedEquipment.description || "Excellent implement model configured for optimal farm productivity. Fully verified and ready for agricultural operations."}
                </p>
              </div>

              {/* Reviews Panel */}
              <div className="pt-6 border-t border-gray-100">
                <h4 className="font-black text-green-950 text-sm mb-4">Customer Reviews & Ratings</h4>
                <ReviewsTab productId={selectedEquipment.productId || selectedEquipment.id} />
              </div>

              {/* Buy Actions */}
              <div className="pt-4 border-t border-gray-100 flex gap-4">
                <button
                  onClick={() => setSelectedEquipment(null)}
                  className="px-5 py-3 border border-gray-200 hover:bg-gray-50 text-gray-600 font-black text-xs rounded-xl transition"
                >
                  Close
                </button>
                {selectedEquipment.forSale && (
                  <button
                    disabled={selectedEquipment.quantity <= 0 || cartLoading}
                    onClick={() => {
                      handleAddToCart(selectedEquipment, 1, false);
                      setSelectedEquipment(null);
                    }}
                    className="flex-grow py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-200 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                  >
                    <ShoppingCart size={15} />
                    Add Equipment to Shopping Cart
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
