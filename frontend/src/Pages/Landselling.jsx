import { useEffect, useState } from "react";
import api, { formatPrice, getPrimaryImage, unwrapPage } from "../services/api";
import {
  MapPin,
  Calendar,
  Search,
  Filter,
  Download,
  Phone,
  Mail,
  User,
  Clock,
  Compass,
  Eye,
  X,
  Droplet,
  Zap,
  CheckCircle,
  AlertCircle,
  TrendingUp
} from "lucide-react";

export default function LandSelling() {
  const [landListings, setLandListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters State
  const [stateFilter, setStateFilter] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [soilFilter, setSoilFilter] = useState("");
  const [waterFilter, setWaterFilter] = useState("");
  const [electricityFilter, setElectricityFilter] = useState(""); // "", "true", "false"
  const [roadFilter, setRoadFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // Modals & Booking states
  const [selectedLand, setSelectedLand] = useState(null);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [visitLoading, setVisitLoading] = useState(false);

  // Visit Request form state
  const [visitForm, setVisitForm] = useState({
    buyerName: "",
    buyerPhone: "",
    buyerEmail: "",
    visitDate: "",
    visitTime: "Morning (9 AM - 12 PM)",
    message: ""
  });

  const getLoggedInUser = () => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  };

  const currentUser = getLoggedInUser();

  // Prefill visit form when user is available or modal opens
  useEffect(() => {
    if (currentUser) {
      setVisitForm(prev => ({
        ...prev,
        buyerName: `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim(),
        buyerPhone: currentUser.phone || "",
        buyerEmail: currentUser.email || ""
      }));
    }
  }, [showVisitModal]);

  const fetchLandListings = async () => {
    setIsLoading(true);
    setError("");
    try {
      const params = {
        size: 50,
        state: stateFilter || undefined,
        district: districtFilter || undefined,
        landType: typeFilter || undefined,
        soilType: soilFilter || undefined,
        waterSource: waterFilter || undefined,
        electricity: electricityFilter !== "" ? (electricityFilter === "true") : undefined,
        roadConnectivity: roadFilter || undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined
      };
      const response = await api.get("/land-listings/search-all", { params });
      setLandListings(unwrapPage(response));
    } catch (err) {
      console.error("Failed to load agricultural lands:", err);
      setError("Failed to fetch land listings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search on filters
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchLandListings();
    }, 450);
    return () => clearTimeout(delayDebounceFn);
  }, [stateFilter, districtFilter, typeFilter, soilFilter, waterFilter, electricityFilter, roadFilter, minPrice, maxPrice]);

  const handleOpenDetails = async (land) => {
    setSelectedLand(land);
    // Increment view count via backend
    try {
      await api.post(`/land-listings/${land.id}/increment-view`);
    } catch (e) {
      console.warn("Failed to increment view count:", e);
    }
  };

  const handleVisitSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      setError("You must be logged in as a buyer to request a visit.");
      return;
    }
    setError("");
    setSuccess("");
    setVisitLoading(true);

    const payload = {
      landListingId: selectedLand.id,
      buyerId: currentUser.id,
      buyerName: visitForm.buyerName,
      buyerPhone: visitForm.buyerPhone,
      buyerEmail: visitForm.buyerEmail,
      visitDate: visitForm.visitDate,
      visitTime: visitForm.visitTime,
      message: visitForm.message
    };

    try {
      await api.post("/land-listings/visits", payload);
      setSuccess("Your visit request has been successfully submitted! The seller will contact you shortly. 🌾");
      setShowVisitModal(false);
      // Reset non-user fields
      setVisitForm(prev => ({
        ...prev,
        visitDate: "",
        message: ""
      }));
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.response?.data?.error || "Failed to submit visit request.");
    } finally {
      setVisitLoading(false);
    }
  };

  const handleResetFilters = () => {
    setStateFilter("");
    setDistrictFilter("");
    setTypeFilter("");
    setSoilFilter("");
    setWaterFilter("");
    setElectricityFilter("");
    setRoadFilter("");
    setMinPrice("");
    setMaxPrice("");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 min-h-screen bg-gradient-to-b from-green-50/20 to-white">
      
      {/* Banner / Header */}
      <div className="bg-gradient-to-r from-green-800 to-emerald-900 text-white rounded-[32px] p-8 md:p-12 shadow-xl relative overflow-hidden flex flex-col justify-center">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="relative z-10 space-y-4 max-w-2xl">
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
            Premium Land Portal
          </span>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            Find & Invest in Fertile Agricultural Lands
          </h1>
          <p className="text-sm md:text-base text-green-100 font-medium">
            Browse verified farmlands with details on soil quality, water sources, road connectivity, electricity, and official survey documents.
          </p>
        </div>
      </div>

      {/* Main Grid: Sidebar + Listings */}
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Filters */}
        <div className="lg:w-80 flex-shrink-0 bg-white rounded-3xl p-6 border border-green-50 shadow-md h-fit space-y-6">
          <div className="flex justify-between items-center border-b border-gray-100 pb-4">
            <h3 className="text-lg font-black text-green-950 flex items-center gap-2">
              <Filter className="text-green-600" size={18} />
              Filter Listings
            </h3>
            <button
              onClick={handleResetFilters}
              className="text-xs font-bold text-green-600 hover:text-green-800"
            >
              Reset All
            </button>
          </div>

          <div className="space-y-4">
            {/* Search by location */}
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-500 mb-1 pl-1">State</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Maharashtra"
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                  className="w-full border border-gray-200 p-3 pl-9 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-green-500 outline-none transition"
                />
                <Search size={14} className="absolute left-3.5 top-4 text-gray-400" />
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-500 mb-1 pl-1">District</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Pune"
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  className="w-full border border-gray-200 p-3 pl-9 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-green-500 outline-none transition"
                />
                <Search size={14} className="absolute left-3.5 top-4 text-gray-400" />
              </div>
            </div>

            {/* Land Type */}
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Land Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="border border-gray-200 p-3 rounded-2xl text-xs font-bold bg-white focus:ring-2 focus:ring-green-500 outline-none transition"
              >
                <option value="">All Land Types</option>
                <option value="Agricultural">Agricultural</option>
                <option value="Farm Land">Farm Land</option>
                <option value="Orchard">Orchard</option>
                <option value="Wetland">Wetland / Paddy Field</option>
              </select>
            </div>

            {/* Soil Type */}
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Soil Type</label>
              <input
                type="text"
                placeholder="e.g. Black, Alluvial"
                value={soilFilter}
                onChange={(e) => setSoilFilter(e.target.value)}
                className="border border-gray-200 p-3 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-green-500 outline-none transition"
              />
            </div>

            {/* Water Source */}
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Water Source</label>
              <input
                type="text"
                placeholder="e.g. Canal, Borewell"
                value={waterFilter}
                onChange={(e) => setWaterFilter(e.target.value)}
                className="border border-gray-200 p-3 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-green-500 outline-none transition"
              />
            </div>

            {/* Electricity */}
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Electricity Availability</label>
              <select
                value={electricityFilter}
                onChange={(e) => setElectricityFilter(e.target.value)}
                className="border border-gray-200 p-3 rounded-2xl text-xs font-bold bg-white focus:ring-2 focus:ring-green-500 outline-none transition"
              >
                <option value="">Any</option>
                <option value="true">Available</option>
                <option value="false">Not Available</option>
              </select>
            </div>

            {/* Price Limits */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 pl-1">Price limit / acre</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full border border-gray-200 p-3 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-green-500 outline-none transition"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full border border-gray-200 p-3 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-green-500 outline-none transition"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Listings Content */}
        <div className="flex-grow space-y-6">
          {/* Notifications */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-2xl flex items-center gap-3 font-semibold animate-fadeIn">
              <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
              <div className="text-sm">{success}</div>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-24 bg-white rounded-3xl border border-green-50 shadow-md">
              <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400 font-bold">Searching verified lands...</p>
            </div>
          ) : landListings.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-gray-200">
              <Compass size={64} className="mx-auto text-gray-300 mb-4 animate-bounce" />
              <h4 className="text-xl font-bold text-gray-700">No Land Listings Found</h4>
              <p className="text-sm text-gray-400 mt-2">Try relaxing your search terms or filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {landListings.map((land) => (
                <div key={land.id} className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-green-50/30 flex flex-col justify-between">
                  <div>
                    {/* Land Image & Status */}
                    <div className="relative h-52 bg-green-50">
                      {land.images && land.images.length > 0 ? (
                        <img
                          src={land.images[0].imageUrl}
                          alt={land.landTitle}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-green-700">
                          <Compass size={64} />
                        </div>
                      )}
                      <div className="absolute top-4 left-4 bg-emerald-600 text-white px-3.5 py-1 rounded-full text-xs font-black shadow-sm">
                        {land.landType}
                      </div>
                    </div>

                    {/* Land details info */}
                    <div className="p-6 space-y-3">
                      <h3 className="text-lg font-black text-green-950 line-clamp-1">{land.landTitle}</h3>
                      <p className="text-xs text-gray-400 font-bold flex items-center gap-1.5">
                        <MapPin size={14} className="text-green-600" />
                        {[land.village, land.taluka, land.district, land.state].filter(Boolean).join(", ")}
                      </p>

                      <div className="grid grid-cols-2 gap-3 text-xs p-3 bg-green-50/30 rounded-2xl border border-green-100/50 mt-4">
                        <div>
                          <span className="text-gray-400 block font-semibold">Area</span>
                          <span className="text-green-900 font-black">{land.areaInAcres} {land.areaUnit || "acres"}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block font-semibold">Water Access</span>
                          <span className="text-green-900 font-black line-clamp-1">{land.waterSourceInformation || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block font-semibold">Electricity</span>
                          <span className="text-green-900 font-black">{land.electricityAvailability ? "Available" : "No"}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block font-semibold">Connectivity</span>
                          <span className="text-green-900 font-black line-clamp-1">{land.roadConnectivity || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pricing and view details */}
                  <div className="p-6 pt-0 border-t border-gray-50 flex items-center justify-between mt-4">
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Price</span>
                      <span className="text-xl font-black text-green-700">
                        {formatPrice(land.pricePerAcre)}
                        <span className="text-xs text-gray-400 font-medium">/{land.areaUnit || "acre"}</span>
                      </span>
                    </div>
                    <button
                      onClick={() => handleOpenDetails(land)}
                      className="bg-green-600 hover:bg-green-700 text-white font-extrabold px-5 py-3 rounded-xl text-xs transition shadow-md shadow-green-100"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* DETAIL MODAL OVERLAY */}
      {selectedLand && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[32px] w-full max-w-3xl shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto animate-scaleUp">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-green-50/50">
              <h3 className="text-2xl font-black text-green-950 flex items-center gap-2">
                <Compass className="text-green-600 animate-spin-slow" size={24} />
                Land Listing Specifications
              </h3>
              <button
                onClick={() => setSelectedLand(null)}
                className="text-gray-400 hover:text-green-950 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              
              {/* Primary Image & Location badges */}
              <div className="relative h-64 rounded-3xl overflow-hidden bg-gray-100 border border-green-50">
                {selectedLand.images && selectedLand.images.length > 0 ? (
                  <img
                    src={selectedLand.images[0].imageUrl}
                    alt={selectedLand.landTitle}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-green-700 bg-green-50">
                    <Compass size={64} />
                  </div>
                )}
                <div className="absolute bottom-4 left-4 bg-black/75 backdrop-blur text-white px-4 py-2 rounded-2xl text-xs font-bold">
                  {selectedLand.areaInAcres} {selectedLand.areaUnit || "acres"} Plot
                </div>
              </div>

              {/* Title & Seller Info */}
              <div className="space-y-2">
                <h4 className="text-2xl font-black text-green-950">{selectedLand.landTitle}</h4>
                <p className="text-sm text-gray-500 font-semibold flex items-center gap-1.5">
                  <MapPin size={16} className="text-green-600" />
                  {[selectedLand.village, selectedLand.taluka, selectedLand.district, selectedLand.state].filter(Boolean).join(", ")}
                </p>
                <div className="flex gap-4 items-center pt-2">
                  <div className="bg-green-50 px-3.5 py-1.5 rounded-xl text-xs font-bold text-green-800">
                    Seller: <span className="font-extrabold">{selectedLand.sellerName || "Verified Owner"}</span>
                  </div>
                  <div className="bg-emerald-50 px-3.5 py-1.5 rounded-xl text-xs font-bold text-emerald-800">
                    Type: <span className="font-extrabold">{selectedLand.landType}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedLand.description && (
                <div className="space-y-1">
                  <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Description</h5>
                  <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    {selectedLand.description}
                  </p>
                </div>
              )}

              {/* Specifications Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Utilities Box */}
                <div className="p-5 border border-green-50 rounded-2xl bg-green-50/10 space-y-3">
                  <h5 className="font-extrabold text-green-950 text-sm border-b border-green-50 pb-2">Utilities & Resources</h5>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-500 flex items-center gap-1.5">
                        <Droplet size={14} className="text-green-600" /> Water Source
                      </span>
                      <span className="font-bold text-green-900">{selectedLand.waterSourceInformation || "Not specified"}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-t border-gray-50">
                      <span className="text-gray-500 flex items-center gap-1.5">
                        <Zap size={14} className="text-green-600" /> Electricity
                      </span>
                      <span className="font-bold text-green-900">{selectedLand.electricityAvailability ? "3-Phase Power available" : "No connection"}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-t border-gray-50">
                      <span className="text-gray-500 flex items-center gap-1.5">
                        <Compass size={14} className="text-green-600" /> Connectivity
                      </span>
                      <span className="font-bold text-green-900">{selectedLand.roadConnectivity || "Dirt Road / Farm Track"}</span>
                    </div>
                  </div>
                </div>

                {/* Soil & Land Stats Box */}
                <div className="p-5 border border-green-50 rounded-2xl bg-green-50/10 space-y-3">
                  <h5 className="font-extrabold text-green-950 text-sm border-b border-green-50 pb-2">Soil & Location details</h5>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-500">Soil Condition</span>
                      <span className="font-bold text-green-900">{selectedLand.soilInformation || "Not analyzed"}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-t border-gray-50">
                      <span className="text-gray-500">Pincode</span>
                      <span className="font-bold text-green-900">{selectedLand.pinCode || "N/A"}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-t border-gray-50">
                      <span className="text-gray-500">Coordinates (Lat / Long)</span>
                      <span className="font-bold text-green-900">{selectedLand.latitude}, {selectedLand.longitude}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-gray-100 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedLand.documentUrl && (
                    <a
                      href={selectedLand.documentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold px-4 py-3 rounded-xl text-xs transition border border-gray-200"
                    >
                      <Download size={14} /> Download Land Deed PDF
                    </a>
                  )}
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${selectedLand.latitude},${selectedLand.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 bg-green-50 hover:bg-green-100 text-green-800 font-extrabold px-4 py-3 rounded-xl text-xs transition border border-green-100"
                  >
                    <MapPin size={14} /> View on Google Maps
                  </a>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowVisitModal(true)}
                    className="bg-green-600 hover:bg-green-700 text-white font-extrabold px-6 py-3.5 rounded-xl text-xs transition shadow-lg shadow-green-100"
                  >
                    Request Site Visit / Contact Seller
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REQUEST VISIT MODAL FORM */}
      {showVisitModal && selectedLand && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl border border-gray-100 animate-scaleUp">
            
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-green-50/50">
              <h3 className="text-xl font-black text-green-950 flex items-center gap-2">
                <Calendar className="text-green-600" size={20} />
                Schedule Site Visit
              </h3>
              <button
                onClick={() => setShowVisitModal(false)}
                className="text-gray-400 hover:text-green-950 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleVisitSubmit} className="p-6 space-y-4">
              
              <div className="p-3 bg-green-50/50 rounded-2xl text-xs font-bold text-green-900 border border-green-50 flex items-center gap-2">
                <Compass size={14} /> Schedule visit for: {selectedLand.landTitle}
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Your Full Name *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={visitForm.buyerName}
                    onChange={(e) => setVisitForm({ ...visitForm, buyerName: e.target.value })}
                    className="w-full border border-gray-300 p-3 pl-9 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none font-bold"
                  />
                  <User size={14} className="absolute left-3.5 top-4 text-gray-400" />
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Contact Phone Number *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={visitForm.buyerPhone}
                    onChange={(e) => setVisitForm({ ...visitForm, buyerPhone: e.target.value })}
                    className="w-full border border-gray-300 p-3 pl-9 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none font-bold"
                  />
                  <Phone size={14} className="absolute left-3.5 top-4 text-gray-400" />
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Email Address *</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={visitForm.buyerEmail}
                    onChange={(e) => setVisitForm({ ...visitForm, buyerEmail: e.target.value })}
                    className="w-full border border-gray-300 p-3 pl-9 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none font-bold"
                  />
                  <Mail size={14} className="absolute left-3.5 top-4 text-gray-400" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Proposed Date *</label>
                  <input
                    type="date"
                    required
                    value={visitForm.visitDate}
                    onChange={(e) => setVisitForm({ ...visitForm, visitDate: e.target.value })}
                    className="border border-gray-300 p-3 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none font-bold"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Preferred Time *</label>
                  <select
                    value={visitForm.visitTime}
                    onChange={(e) => setVisitForm({ ...visitForm, visitTime: e.target.value })}
                    className="border border-gray-300 p-3 rounded-xl text-sm bg-white focus:ring-2 focus:ring-green-500 outline-none font-bold"
                  >
                    <option value="Morning (9 AM - 12 PM)">Morning (9-12)</option>
                    <option value="Afternoon (12 PM - 3 PM)">Afternoon (12-3)</option>
                    <option value="Evening (3 PM - 6 PM)">Evening (3-6)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Message to Seller (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Ask questions about water access, ownership, or request custom timings..."
                  value={visitForm.message}
                  onChange={(e) => setVisitForm({ ...visitForm, message: e.target.value })}
                  className="border border-gray-300 p-3 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowVisitModal(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-5 py-3 rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={visitLoading}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-extrabold px-6 py-3 rounded-xl text-xs transition flex items-center gap-2"
                >
                  {visitLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  Schedule Visit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
