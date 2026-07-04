import React, { useState, useEffect } from "react";
import api from "../services/api";
import AddressAutocomplete from "../components/AddressAutocomplete";
import LocationPicker from "../components/LocationPicker";
import {
  MapPin, PlusCircle, Home, Briefcase, Warehouse, Leaf, Trash2, Edit, Star, X, Phone, Save, Globe
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function AddressManagement() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [alternateMobileNumber, setAlternateMobileNumber] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [street, setStreet] = useState("");
  const [landmark, setLandmark] = useState("");
  const [village, setVillage] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [country, setCountry] = useState("India");
  const [addressType, setAddressType] = useState("HOME");
  const [isDefault, setIsDefault] = useState(false);
  
  // Coordinates for Map
  const [coordinates, setCoordinates] = useState({ lat: 23.2599, lng: 77.4126 });

  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setCurrentUser(parsed);
      fetchAddresses(parsed.id);
    }
  }, []);

  // Scroll lock background content when address form drawer is open
  useEffect(() => {
    if (isFormOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isFormOpen]);

  const fetchAddresses = async (userId) => {
    try {
      setLoading(true);
      const res = await api.get(`/addresses/user/${userId}`);
      if (res.data && res.data.success) {
        setAddresses(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch addresses:", err);
      toast.error("Could not load addresses.");
    } finally {
      setLoading(false);
    }
  };

  const openAddForm = () => {
    setEditingAddress(null);
    setFullName("");
    setMobileNumber("");
    setAlternateMobileNumber("");
    setHouseNumber("");
    setStreet("");
    setLandmark("");
    setVillage("");
    setCity("");
    setDistrict("");
    setState("");
    setPincode("");
    setCountry("India");
    setAddressType("HOME");
    setIsDefault(false);
    setCoordinates({ lat: 23.2599, lng: 77.4126 });
    setIsFormOpen(true);
  };

  const openEditForm = (addr) => {
    setEditingAddress(addr);
    setFullName(addr.fullName);
    setMobileNumber(addr.mobileNumber);
    setAlternateMobileNumber(addr.alternateMobileNumber || "");
    setHouseNumber(addr.houseNumber);
    setStreet(addr.street);
    setLandmark(addr.landmark || "");
    setVillage(addr.village || "");
    setCity(addr.city);
    setDistrict(addr.district);
    setState(addr.state);
    setPincode(addr.pincode);
    setCountry(addr.country || "India");
    setAddressType(addr.addressType);
    setIsDefault(addr.isDefault || false);
    setCoordinates({
      lat: addr.latitude || 23.2599,
      lng: addr.longitude || 77.4126
    });
    setIsFormOpen(true);
  };

  const handleAutocompleteSelected = (data) => {
    setStreet(data.street);
    setVillage(data.village);
    setCity(data.city);
    setDistrict(data.district);
    setState(data.state);
    setPincode(data.pincode);
    setCoordinates({ lat: data.latitude, lng: data.longitude });
  };

  const handleLocationChange = (coords) => {
    setCoordinates(coords);
    // Reverse geocode to fill in address inputs automatically on marker move!
    api.get("/maps/reverse-geocode", { params: { lat: coords.lat, lon: coords.lng } })
      .then((res) => {
        if (res.data && res.data.success && res.data.data) {
          // Parse basic components from string or set general address details
          const parts = res.data.data.split(",");
          if (parts.length > 0) setStreet(parts[0].trim());
          if (parts.length > 1) setCity(parts[1].trim());
          if (parts.length > 2) setDistrict(parts[2].trim());
        }
      })
      .catch((e) => console.log("Reverse geocode skip", e));
  };

  const handleSetDefault = async (addrId) => {
    if (!currentUser) return;
    try {
      const res = await api.put(`/addresses/user/${currentUser.id}/default/${addrId}`);
      if (res.data && res.data.success) {
        toast.success("Default address updated successfully!");
        fetchAddresses(currentUser.id);
      }
    } catch (err) {
      console.error("Failed to set default address:", err);
      toast.error("Could not set default address.");
    }
  };

  const handleDelete = async (addrId) => {
    if (!currentUser) return;
    if (!window.confirm("Are you sure you want to delete this address?")) return;

    try {
      const res = await api.delete(`/addresses/${addrId}`);
      if (res.data && res.data.success) {
        toast.success("Address deleted successfully!");
        fetchAddresses(currentUser.id);
      }
    } catch (err) {
      console.error("Failed to delete address:", err);
      toast.error(err.response?.data?.message || "Could not delete address.");
    }
  };

  const validateForm = () => {
    if (!fullName.trim()) return "Full name is required";
    if (!/^[6-9]\d{9}$/.test(mobileNumber)) return "Mobile number must be a valid 10-digit number";
    if (!houseNumber.trim()) return "House/Flat number is required";
    if (!street.trim()) return "Street address is required";
    if (!city.trim()) return "Village/City is required";
    if (!district.trim()) return "District is required";
    if (!state.trim()) return "State is required";
    if (!/^[1-9]\d{5}$/.test(pincode)) return "Pincode must be a valid 6-digit number";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSubmitting(true);
    const payload = {
      userId: currentUser.id,
      fullName,
      mobileNumber,
      alternateMobileNumber: alternateMobileNumber || null,
      houseNumber,
      street,
      landmark: landmark || null,
      village: village || null,
      city,
      district,
      state,
      pincode,
      country,
      addressType,
      isDefault,
      latitude: coordinates.lat,
      longitude: coordinates.lng
    };

    try {
      let res;
      if (editingAddress) {
        res = await api.put(`/addresses/${editingAddress.id}`, payload);
      } else {
        res = await api.post("/addresses", payload);
      }

      if (res.data && res.data.success) {
        toast.success(editingAddress ? "Address updated successfully!" : "Address added successfully!");
        setIsFormOpen(false);
        fetchAddresses(currentUser.id);
      }
    } catch (err) {
      console.error("Error saving address:", err);
      toast.error(err.response?.data?.message || "Could not save address.");
    } finally {
      setSubmitting(false);
    }
  };

  const getAddressIcon = (type) => {
    switch (type) {
      case "HOME": return <Home size={18} className="text-blue-500" />;
      case "OFFICE": return <Briefcase size={18} className="text-purple-500" />;
      case "WAREHOUSE": return <Warehouse size={18} className="text-amber-500" />;
      case "FARM": return <Leaf size={18} className="text-emerald-500" />;
      default: return <MapPin size={18} className="text-gray-500" />;
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-emerald-50/20 via-white to-green-50/20 px-4 md:px-8 py-10 font-outfit">
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-5">
          <div>
            <h1 className="text-3xl font-black text-emerald-950 font-outfit tracking-tight">Shipping Addresses</h1>
            <p className="text-xs text-emerald-800/70 mt-1">Manage multiple addresses and pin precise GPS coordinates for delivery mapping.</p>
          </div>
          <button
            onClick={openAddForm}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-2xl font-bold transition shadow-sm text-xs cursor-pointer active:scale-95"
          >
            <PlusCircle size={16} />
            Add New Address
          </button>
        </div>

        {/* List Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-xs text-emerald-800 font-bold">Synchronizing address database...</p>
          </div>
        ) : addresses.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 border border-emerald-100/50 shadow-sm text-center max-w-xl mx-auto space-y-4 my-10">
            <MapPin className="text-emerald-300 mx-auto" size={48} />
            <div>
              <h3 className="text-lg font-black text-emerald-950">No Saved Addresses</h3>
              <p className="text-xs text-emerald-800/60 font-medium mt-1">Add an address now to support order routing and distance estimates.</p>
            </div>
            <button
              onClick={openAddForm}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow transition"
            >
              Create First Address
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={`bg-white rounded-3xl p-6 border-2 transition relative flex flex-col justify-between min-h-60 ${
                  addr.isDefault
                    ? "border-emerald-600 shadow-md shadow-emerald-50"
                    : "border-gray-100 hover:border-emerald-200 shadow-sm"
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                      {getAddressIcon(addr.addressType)}
                      <span className="text-[10px] font-black text-gray-700 uppercase tracking-wider">
                        {addr.addressType}
                      </span>
                    </div>
                    {addr.isDefault ? (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Star size={10} fill="currentColor" /> Primary
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSetDefault(addr.id)}
                        className="text-[10px] text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 px-2 py-1 rounded-lg border border-transparent hover:border-emerald-100 transition font-bold cursor-pointer"
                      >
                        Set as Default
                      </button>
                    )}
                  </div>

                  <h4 className="font-extrabold text-emerald-950 text-base">{addr.fullName}</h4>
                  
                  <p className="text-xs text-emerald-800/70 font-semibold leading-relaxed mt-2">
                    {addr.houseNumber}, {addr.street}
                    {addr.landmark && `, Near ${addr.landmark}`}
                    {addr.village && `, Village: ${addr.village}`}
                    <br />
                    {addr.city}, {addr.district}
                    <br />
                    {addr.state} - {addr.pincode}
                    {addr.latitude && addr.longitude && (
                      <span className="block mt-2 text-[10px] font-bold text-emerald-700/60 font-mono">
                        📍 GPS: {addr.latitude.toFixed(4)}, {addr.longitude.toFixed(4)}
                      </span>
                    )}
                  </p>
                </div>

                <div className="border-t border-gray-100 pt-4 mt-4 flex justify-between items-center">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-800/70 font-bold">
                    <Phone size={12} className="text-emerald-400" />
                    <span>{addr.mobileNumber}</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditForm(addr)}
                      className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition cursor-pointer"
                      title="Edit Address"
                    >
                      <Edit size={16} />
                    </button>
                    {!addr.isDefault && (
                      <button
                        onClick={() => handleDelete(addr.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                        title="Delete Address"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Form Overlay Dialog Drawer */}
        {isFormOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsFormOpen(false)} />
            
            <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
              <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col justify-between rounded-l-3xl overflow-hidden">
                
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-emerald-950 text-white">
                  <div>
                    <h3 className="text-lg font-black">{editingAddress ? "Edit Address Details" : "Add Address Details"}</h3>
                    <p className="text-[10px] text-emerald-300 font-bold mt-0.5">Please check pin coordinates to ensure accurate order distance matrix checks.</p>
                  </div>
                  <button
                    onClick={() => setIsFormOpen(false)}
                    className="p-2 text-emerald-300 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Form Body - Dual Split Grid (Fields left, Map right) */}
                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Left Column: Form Inputs */}
                  <form className="space-y-4">
                    <div className="bg-emerald-50/20 border border-emerald-100/30 p-4 rounded-2xl mb-2">
                      <label className="text-xs font-bold text-emerald-800 mb-1 pl-1 block">Google Places Lookup</label>
                      <AddressAutocomplete onAddressSelected={handleAutocompleteSelected} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Address Type</label>
                        <select
                          value={addressType}
                          onChange={(e) => setAddressType(e.target.value)}
                          className="border border-gray-250 p-3 rounded-xl text-xs bg-white font-bold text-gray-700 focus:border-emerald-500 focus:outline-none"
                        >
                          <option value="HOME">Home</option>
                          <option value="FARM">Farm / Fields</option>
                          <option value="OFFICE">Office</option>
                          <option value="WAREHOUSE">Warehouse</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                      <div className="flex items-end pb-3">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isDefault}
                            onChange={(e) => setIsDefault(e.target.checked)}
                            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                          />
                          <span className="text-xs font-bold text-gray-600">Set as Primary</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Full Name</label>
                      <input
                        type="text"
                        placeholder="Recipient's Name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="border border-gray-255 p-3 rounded-xl text-xs focus:border-emerald-500 focus:outline-none"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Mobile Number</label>
                        <input
                          type="tel"
                          placeholder="10-digit mobile"
                          value={mobileNumber}
                          onChange={(e) => setMobileNumber(e.target.value)}
                          className="border border-gray-255 p-3 rounded-xl text-xs focus:border-emerald-500 focus:outline-none"
                          required
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Alt Contact</label>
                        <input
                          type="tel"
                          placeholder="Alternate phone"
                          value={alternateMobileNumber}
                          onChange={(e) => setAlternateMobileNumber(e.target.value)}
                          className="border border-gray-255 p-3 rounded-xl text-xs focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1 pl-1">House/Flat Number</label>
                      <input
                        type="text"
                        placeholder="Flat, Plot, Shop No."
                        value={houseNumber}
                        onChange={(e) => setHouseNumber(e.target.value)}
                        className="border border-gray-255 p-3 rounded-xl text-xs focus:border-emerald-500 focus:outline-none"
                        required
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Street Address</label>
                      <input
                        type="text"
                        placeholder="Area, Colony, Road Name"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        className="border border-gray-255 p-3 rounded-xl text-xs focus:border-emerald-500 focus:outline-none"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Village (Optional)</label>
                        <input
                          type="text"
                          placeholder="Village name"
                          value={village}
                          onChange={(e) => setVillage(e.target.value)}
                          className="border border-gray-255 p-3 rounded-xl text-xs focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Landmark</label>
                        <input
                          type="text"
                          placeholder="e.g. Near Hanuman Temple"
                          value={landmark}
                          onChange={(e) => setLandmark(e.target.value)}
                          className="border border-gray-255 p-3 rounded-xl text-xs focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Village/City</label>
                        <input
                          type="text"
                          placeholder="City / Town"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="border border-gray-255 p-3 rounded-xl text-xs focus:border-emerald-500 focus:outline-none"
                          required
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-xs font-bold text-gray-500 mb-1 pl-1">District</label>
                        <input
                          type="text"
                          placeholder="District"
                          value={district}
                          onChange={(e) => setDistrict(e.target.value)}
                          className="border border-gray-255 p-3 rounded-xl text-xs focus:border-emerald-500 focus:outline-none"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <label className="text-xs font-bold text-gray-500 mb-1 pl-1">State</label>
                        <input
                          type="text"
                          placeholder="State"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="border border-gray-255 p-3 rounded-xl text-xs focus:border-emerald-500 focus:outline-none"
                          required
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Pincode</label>
                        <input
                          type="text"
                          placeholder="6-digit PIN"
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value)}
                          className="border border-gray-255 p-3 rounded-xl text-xs focus:border-emerald-500 focus:outline-none"
                          required
                        />
                      </div>
                    </div>
                  </form>

                  {/* Right Column: Interactive Location Picker */}
                  <div className="space-y-4">
                    <div className="bg-emerald-50/20 border border-emerald-100/30 p-4 rounded-2xl">
                      <h4 className="font-bold text-emerald-950 text-xs flex items-center gap-1.5 mb-2">
                        <Globe size={14} className="text-emerald-600" />
                        Verify Delivery Coordinates
                      </h4>
                      <p className="text-[10px] text-emerald-800/60 leading-relaxed">
                        Drag the marker below to specify your exact door location. This calculates correct seller delivery zones.
                      </p>
                    </div>

                    <LocationPicker
                      initialLat={coordinates.lat}
                      initialLon={coordinates.lng}
                      onLocationChange={handleLocationChange}
                      containerStyle={{ width: "100%", height: "420px" }}
                    />
                    
                    <div className="bg-gray-50 p-4 rounded-2xl text-[10px] text-gray-500 font-mono grid grid-cols-2 gap-2 border border-gray-150">
                      <div>Lat: {coordinates.lat.toFixed(6)}</div>
                      <div>Lon: {coordinates.lng.toFixed(6)}</div>
                    </div>
                  </div>

                </div>

                {/* Footer Buttons */}
                <div className="p-6 border-t border-gray-100 flex gap-4 bg-gray-50">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="flex-1 py-3.5 border border-gray-250 text-gray-600 hover:bg-gray-100 rounded-xl font-bold transition text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl font-bold transition text-xs flex items-center justify-center cursor-pointer shadow"
                  >
                    {submitting ? (
                      <span className="w-4.5 h-4.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : editingAddress ? (
                      "Save Updates"
                    ) : (
                      "Save New Address"
                    )}
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
