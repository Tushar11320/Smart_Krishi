import React, { useState, useEffect } from "react";
import api, { formatPrice, getPrimaryImage } from "../services/api";
import {
  X,
  Calendar,
  ShoppingCart,
  Shield,
  Info,
  Phone,
  MessageSquare,
  Check,
  Truck,
  Heart,
  FileText,
  Video,
  Download,
  AlertCircle,
  CheckCircle,
  Bookmark
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import ReviewsTab from "./ReviewsTab";

export default function MachineryDetailModal({ machinery, onClose, onAddToCart }) {
  const navigate = useNavigate();
  const [activeImage, setActiveImage] = useState("");
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  
  // Rental scheduling states
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Wishlist state
  const [inWishlist, setInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const getLoggedInUser = () => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  };

  const user = getLoggedInUser();
  const userId = user?.id;

  // Set initial main image
  useEffect(() => {
    if (machinery) {
      const primary = getPrimaryImage(machinery);
      setActiveImage(primary);
      fetchBookings();
      checkWishlistStatus();
    }
  }, [machinery]);

  // Scroll lock background content when modal is mounted/open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const fetchBookings = async () => {
    if (!machinery?.id) return;
    setLoadingBookings(true);
    try {
      const res = await api.get(`/machinery/bookings/machinery/${machinery.id}`);
      setBookings(res.data?.data || res.data || []);
    } catch (err) {
      console.error("Failed to load machinery rental bookings:", err);
    } finally {
      setLoadingBookings(false);
    }
  };

  const checkWishlistStatus = async () => {
    if (!userId || !machinery?.productId) return;
    try {
      const res = await api.get(`/wishlist/${userId}`);
      const items = res.data?.data?.wishlistItems || res.data?.wishlistItems || [];
      const exists = items.some(item => (item.productId === machinery.productId || item.product?.id === machinery.productId));
      setInWishlist(exists);
    } catch (err) {
      console.error("Failed to check wishlist status:", err);
    }
  };

  const handleToggleWishlist = async () => {
    if (!userId) {
      setError("Please log in to save to your wishlist.");
      return;
    }
    setWishlistLoading(true);
    setError("");
    try {
      if (inWishlist) {
        await api.delete(`/wishlist/${userId}/product/${machinery.productId}`);
        setInWishlist(false);
        setSuccess("Removed from Wishlist");
      } else {
        await api.post(`/wishlist/${userId}/product/${machinery.productId}`);
        setInWishlist(true);
        setSuccess("Added to Wishlist!");
      }
      setTimeout(() => setSuccess(""), 2500);
    } catch (err) {
      console.error("Wishlist action failed:", err);
      setError("Failed to update wishlist.");
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleBookRental = async (e) => {
    e.preventDefault();
    if (!userId) {
      setError("Please log in to submit a rental booking request.");
      return;
    }
    if (!startDate || !endDate) {
      setError("Please select a valid date range.");
      return;
    }
    
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        machineryId: machinery.id,
        buyerId: userId,
        startDate,
        endDate
      };

      await api.post("/machinery/rent", payload);
      setSuccess("Rental booking request submitted successfully! Pending seller approval. 🚜");
      setStartDate("");
      setEndDate("");
      fetchBookings();
    } catch (err) {
      console.error("Rental booking failed:", err);
      setError(err.response?.data?.message || "Booking overlaps with an existing reservation. Please select other dates.");
    } finally {
      setSubmitting(false);
    }
  };

  const calculateCostBreakdown = () => {
    if (!startDate || !endDate || !machinery) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) return null;

    const days = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
    const dailyPrice = machinery.rentPerDay || 0;
    const weeklyPrice = machinery.rentPerWeek || 0;
    const security = machinery.securityDeposit || 0;

    // Calculate best rate logic
    let rentPrice = 0;
    if (weeklyPrice > 0 && days >= 7) {
      const weeks = Math.floor(days / 7);
      const remainingDays = days % 7;
      rentPrice = (weeks * weeklyPrice) + (remainingDays * dailyPrice);
    } else {
      rentPrice = days * dailyPrice;
    }

    return {
      days,
      rentPrice,
      securityDeposit: security,
      totalCost: rentPrice + security
    };
  };

  const cost = calculateCostBreakdown();

  return (
    <div className="fixed inset-0 bg-green-950/40 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-[32px] w-full max-w-4xl shadow-2xl border border-green-100 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden max-h-[90vh] md:max-h-[85vh] animate-scaleUp">
        
        {/* Left Side: Images & Gallery */}
        <div className="w-full md:w-1/2 bg-gradient-to-br from-green-50/30 to-amber-50/20 p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-gray-100">
          <div className="relative flex-grow flex items-center justify-center min-h-[280px]">
            <img
              src={activeImage}
              alt={machinery.productName}
              className="max-h-72 w-full object-contain rounded-2xl p-2 transition duration-300"
            />
            
            <button
              onClick={handleToggleWishlist}
              disabled={wishlistLoading}
              className={`absolute top-4 left-4 p-3 rounded-full shadow-md transition ${
                inWishlist 
                  ? "bg-red-50 text-red-500 hover:bg-red-100" 
                  : "bg-white text-gray-400 hover:text-red-500"
              }`}
            >
              <Heart fill={inWishlist ? "currentColor" : "none"} size={20} />
            </button>

            <span className="absolute bottom-4 right-4 bg-green-900/90 text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider">
              {machinery.brandName} {machinery.modelNumber}
            </span>
          </div>

          {/* Thumbnails */}
          {machinery.imageUrls && machinery.imageUrls.length > 1 && (
            <div className="flex gap-2 overflow-x-auto py-2 px-1 scrollbar-thin">
              {machinery.imageUrls.map((url, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImage(url)}
                  className={`w-16 h-16 rounded-xl border-2 flex-shrink-0 overflow-hidden bg-white p-1 transition ${
                    activeImage === url ? "border-green-600 shadow-sm" : "border-gray-200"
                  }`}
                >
                  <img src={url} className="w-full h-full object-contain" alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Details & Scheduling Form */}
        <div className="w-full md:w-1/2 p-6 overflow-y-visible md:overflow-y-auto flex flex-col justify-between space-y-6">
          
          {/* Header */}
          <div className="relative">
            <button
              onClick={onClose}
              className="absolute -top-2 -right-2 bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-full transition"
            >
              <X size={20} />
            </button>

            <div className="pr-8 space-y-1">
              <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                {machinery.machineryType} • {machinery.conditionStatus}
              </span>
              <h2 className="text-2xl font-black text-green-950 pt-2 leading-snug">
                {machinery.productName}
              </h2>
              <p className="text-xs text-gray-400 font-bold">
                Seller: {machinery.sellerBusinessName || "SmartKrishi Certified Partner"}
              </p>
            </div>
          </div>

          {/* Notifications */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded-2xl flex items-center gap-2 text-xs font-semibold animate-fadeIn">
              <CheckCircle className="text-green-600 flex-shrink-0" size={18} />
              <div>{success}</div>
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-2xl flex items-center gap-2 text-xs font-semibold animate-fadeIn">
              <AlertCircle className="text-red-600 flex-shrink-0" size={18} />
              <div>{error}</div>
            </div>
          )}

          {/* Pricing Blocks */}
          <div className="grid grid-cols-2 gap-3 bg-green-50/30 p-4 rounded-2xl border border-green-100/30">
            {machinery.availableForSale && (
              <div>
                <span className="text-[10px] uppercase font-black text-gray-400">Outright Purchase</span>
                <strong className="text-lg font-black text-amber-600 block mt-0.5">
                  {formatPrice(machinery.price)}
                </strong>
                {machinery.negotiable && (
                  <span className="text-[9px] font-black text-green-700 bg-green-100 px-1.5 py-0.5 rounded">Negotiable</span>
                )}
              </div>
            )}
            {machinery.availableForRent && (
              <div>
                <span className="text-[10px] uppercase font-black text-gray-400">Rental Rates</span>
                <div className="text-xs font-semibold text-green-950 mt-1 flex flex-col">
                  {machinery.rentPerHour && <span>• {formatPrice(machinery.rentPerHour)} / hour</span>}
                  {machinery.rentPerDay && <span>• {formatPrice(machinery.rentPerDay)} / day</span>}
                  {machinery.rentPerWeek && <span>• {formatPrice(machinery.rentPerWeek)} / week</span>}
                </div>
              </div>
            )}
          </div>

          {/* Specifications Accordion/Grid */}
          <div className="space-y-3">
            <h4 className="font-black text-green-950 text-sm flex items-center gap-1">
              <Info size={16} className="text-amber-500" />
              Technical Specifications
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-50 p-2.5 rounded-xl flex flex-col">
                <span className="text-gray-400 text-[9px] uppercase font-black">Horsepower</span>
                <strong className="text-green-900 font-bold">{machinery.powerHp ? `${machinery.powerHp} HP` : "N/A"}</strong>
              </div>
              <div className="bg-gray-50 p-2.5 rounded-xl flex flex-col">
                <span className="text-gray-400 text-[9px] uppercase font-black">Fuel Type</span>
                <strong className="text-green-900 font-bold">{machinery.fuelType || machinery.engineType || "Diesel"}</strong>
              </div>
              <div className="bg-gray-50 p-2.5 rounded-xl flex flex-col">
                <span className="text-gray-400 text-[9px] uppercase font-black">Working Width</span>
                <strong className="text-green-900 font-bold">{machinery.workingWidth || "Standard"}</strong>
              </div>
              <div className="bg-gray-50 p-2.5 rounded-xl flex flex-col">
                <span className="text-gray-400 text-[9px] uppercase font-black">Weight</span>
                <strong className="text-green-900 font-bold">{machinery.weight || "N/A"}</strong>
              </div>
              {machinery.manufacturingYear && (
                <div className="bg-gray-50 p-2.5 rounded-xl flex flex-col">
                  <span className="text-gray-400 text-[9px] uppercase font-black">Mfg Year</span>
                  <strong className="text-green-900 font-bold">{machinery.manufacturingYear}</strong>
                </div>
              )}
              {machinery.capacitySpecification && (
                <div className="bg-gray-50 p-2.5 rounded-xl flex flex-col">
                  <span className="text-gray-400 text-[9px] uppercase font-black">Capacity</span>
                  <strong className="text-green-900 font-bold">{machinery.capacitySpecification}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {machinery.description && (
            <div className="space-y-1.5">
              <h4 className="font-black text-green-950 text-sm">Description</h4>
              <p className="text-xs text-gray-500 font-bold leading-relaxed line-clamp-3 hover:line-clamp-none transition-all duration-300">
                {machinery.description}
              </p>
            </div>
          )}

          {/* Location Block */}
          <div className="bg-amber-50/40 p-4 border border-amber-100 rounded-2xl text-xs space-y-1 font-semibold text-green-950">
            <div className="text-[10px] uppercase font-black text-gray-400">Available Location</div>
            <div>District: <strong className="text-green-900">{machinery.district || "N/A"}</strong>, State: <strong className="text-green-900">{machinery.state || "N/A"}</strong></div>
            {machinery.villageCity && <div>Village/City: {machinery.villageCity} {machinery.pincode ? `(${machinery.pincode})` : ""}</div>}
          </div>

          {/* Uploaded Documents */}
          {(machinery.registrationCertificateUrl || machinery.insuranceDocumentUrl) && (
            <div className="space-y-2">
              <h4 className="font-black text-green-950 text-xs uppercase tracking-wider pl-1">Verified Documentation</h4>
              <div className="flex flex-col gap-2">
                {machinery.registrationCertificateUrl && (
                  <a
                    href={machinery.registrationCertificateUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 border border-green-200 bg-green-50/20 text-green-800 text-xs rounded-xl flex items-center justify-between hover:bg-green-50 transition font-bold"
                  >
                    <span className="flex items-center gap-2">
                      <FileText size={16} className="text-green-600" />
                      Registration Certificate (RC)
                    </span>
                    <Download size={14} />
                  </a>
                )}
                {machinery.insuranceDocumentUrl && (
                  <a
                    href={machinery.insuranceDocumentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 border border-green-200 bg-green-50/20 text-green-800 text-xs rounded-xl flex items-center justify-between hover:bg-green-50 transition font-bold"
                  >
                    <span className="flex items-center gap-2">
                      <Shield size={16} className="text-green-600" />
                      Insurance Document
                    </span>
                    <Download size={14} />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Rental booking calendar & calculator */}
          {machinery.availableForRent && (
            <div className="space-y-3 p-4 border border-blue-100 rounded-[24px] bg-blue-50/20">
              <h4 className="font-black text-green-950 text-xs flex items-center gap-1.5">
                <Calendar size={16} className="text-blue-600" />
                Rent Machinery Scheduling
              </h4>

              {/* Reserved booked slots */}
              <div className="text-xs font-semibold">
                <span className="text-[10px] text-gray-400 uppercase font-black block mb-1">Booked Slots</span>
                {loadingBookings ? (
                  <div className="text-[11px] text-gray-400 animate-pulse">Checking calendar availability...</div>
                ) : bookings.length === 0 ? (
                  <span className="text-green-700 italic font-bold">100% available slots! Request your rent dates below.</span>
                ) : (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {bookings.map((b) => (
                      <span
                        key={b.id}
                        className="text-[10px] font-bold bg-red-50 text-red-700 border border-red-100 px-2 py-0.5 rounded"
                      >
                        {new Date(b.startDate).toLocaleDateString()} to {new Date(b.endDate).toLocaleDateString()}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Date pickers */}
              <form onSubmit={handleBookRental} className="grid grid-cols-2 gap-2 pt-2">
                <div className="flex flex-col">
                  <label className="text-[9px] font-black uppercase text-gray-400 mb-1 pl-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="p-2.5 border border-gray-200 rounded-xl text-xs bg-white text-gray-800"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-[9px] font-black uppercase text-gray-400 mb-1 pl-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || new Date().toISOString().split("T")[0]}
                    className="p-2.5 border border-gray-200 rounded-xl text-xs bg-white text-gray-800"
                  />
                </div>

                {cost && (
                  <div className="col-span-2 p-3 bg-green-50/50 border border-green-200/50 rounded-xl text-[11px] font-semibold text-green-900 space-y-1 animate-fadeIn">
                    <div className="flex justify-between">
                      <span>Rental Period:</span>
                      <strong>{cost.days} Day(s)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Calculated Rental Charge:</span>
                      <strong>{formatPrice(cost.rentPrice)}</strong>
                    </div>
                    {cost.securityDeposit > 0 && (
                      <div className="flex justify-between">
                        <span>Security Deposit (Refundable):</span>
                        <strong>{formatPrice(cost.securityDeposit)}</strong>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-green-200 pt-1 text-xs font-black text-green-950">
                      <span>Grand Total:</span>
                      <span>{formatPrice(cost.totalCost)}</span>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="col-span-2 mt-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
                >
                  {submitting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  Request Rental Booking
                </button>
              </form>
            </div>
          )}

          {/* Reviews Panel */}
          <div className="pt-6 border-t border-gray-100">
            <h4 className="font-black text-green-950 text-sm mb-4">Customer Reviews & Ratings</h4>
            <ReviewsTab productId={machinery.productId || machinery.id} />
          </div>

          {/* Contact Details */}
          <div className="space-y-2.5 pt-2 border-t border-gray-100">
            <h4 className="font-black text-green-950 text-xs uppercase tracking-wider pl-1">Direct Contact Details</h4>
            <div className="flex gap-2">
              {machinery.mobileNumber && (
                <a
                  href={`tel:${machinery.mobileNumber}`}
                  className="flex-grow py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-xs rounded-xl transition flex items-center justify-center gap-2 border border-gray-200/50"
                >
                  <Phone size={15} />
                  Call: {machinery.sellerContactName || "Seller"}
                </a>
              )}
              {machinery.whatsappNumber && (
                <a
                  href={`https://wa.me/${machinery.whatsappNumber.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-grow py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-md"
                >
                  <MessageSquare size={15} />
                  WhatsApp Seller
                </a>
              )}
            </div>
          </div>

          {/* Buy Action */}
          {machinery.availableForSale && (
            <div className="pt-2">
              <button
                onClick={() => {
                  onAddToCart(machinery);
                  onClose();
                }}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
              >
                <ShoppingCart size={16} />
                Add to Shopping Cart (Buy Now)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
