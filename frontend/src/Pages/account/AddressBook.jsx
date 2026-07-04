import React, { useState, useEffect } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import {
  MapPin,
  PlusCircle,
  Home,
  Briefcase,
  Warehouse,
  Leaf,
  Settings,
  Trash2,
  Edit,
  Star,
  Check,
  X,
  Phone,
  Info
} from "lucide-react";

export default function AddressBook() {
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
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [country, setCountry] = useState("India");
  const [addressType, setAddressType] = useState("HOME");
  const [isDefault, setIsDefault] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setCurrentUser(parsed);
      fetchAddresses(parsed.id);
    }
  }, []);

  const fetchAddresses = async (userId) => {
    try {
      setLoading(true);
      const res = await api.get(`/addresses/user/${userId}`);
      if (res.data && res.data.success) {
        setAddresses(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch addresses:", err);
      toast.error("Could not load addresses. Please try again.");
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
    setCity("");
    setDistrict("");
    setState("");
    setPincode("");
    setCountry("India");
    setAddressType("HOME");
    setIsDefault(false);
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
    setCity(addr.city);
    setDistrict(addr.district);
    setState(addr.state);
    setPincode(addr.pincode);
    setCountry(addr.country || "India");
    setAddressType(addr.addressType);
    setIsDefault(addr.isDefault || false);
    setIsFormOpen(true);
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
      const errorMsg = err.response?.data?.message || "Could not delete address.";
      toast.error(errorMsg);
    }
  };

  const validateForm = () => {
    if (!fullName.trim()) return "Full name is required";
    if (!/^[6-9]\d{9}$/.test(mobileNumber)) return "Mobile number must be a valid 10-digit number starting with 6-9";
    if (alternateMobileNumber && !/^[6-9]\d{9}$/.test(alternateMobileNumber)) {
      return "Alternate mobile number must be a valid 10-digit number starting with 6-9";
    }
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
      city,
      district,
      state,
      pincode,
      country,
      addressType,
      isDefault
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
      const errorMsg = err.response?.data?.message || "Could not save address. Please try again.";
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const getAddressIcon = (type) => {
    switch (type) {
      case "HOME":
        return <Home size={18} className="text-blue-500" />;
      case "OFFICE":
        return <Briefcase size={18} className="text-purple-500" />;
      case "WAREHOUSE":
        return <Warehouse size={18} className="text-amber-500" />;
      case "FARM":
        return <Leaf size={18} className="text-emerald-500" />;
      default:
        return <MapPin size={18} className="text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn font-outfit">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-2xl font-black text-green-950">My Shipping Addresses</h1>
          <p className="text-xs text-gray-500 mt-1">Manage multiple addresses for faster checkout and delivery operations.</p>
        </div>
        <button
          onClick={openAddForm}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl font-bold transition shadow-sm text-xs cursor-pointer"
        >
          <PlusCircle size={16} />
          Add New Address
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-3 text-xs text-gray-500 font-bold">Synchronizing address vault...</p>
        </div>
      ) : addresses.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-gray-150 shadow-sm text-center max-w-xl mx-auto space-y-4 my-10">
          <MapPin className="text-gray-300 mx-auto" size={48} />
          <div className="space-y-1">
            <h3 className="text-lg font-black text-green-950">No Saved Addresses</h3>
            <p className="text-xs text-gray-400 font-medium">Add an address now to easily order crops, machinery, fertilizers, and building materials.</p>
          </div>
          <button
            onClick={openAddForm}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs rounded-xl shadow transition"
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
                  ? "border-green-600 shadow-md shadow-green-50"
                  : "border-gray-150 hover:border-green-200 shadow-sm"
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
                    <span className="bg-green-50 text-green-700 border border-green-200 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                      <Star size={10} fill="currentColor" /> Primary
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      className="text-[10px] text-gray-400 hover:text-green-700 hover:bg-green-50 px-2 py-1 rounded-lg border border-transparent hover:border-green-100 transition font-bold cursor-pointer"
                    >
                      Set as Default
                    </button>
                  )}
                </div>

                <h4 className="font-extrabold text-green-950 text-base">{addr.fullName}</h4>
                
                <p className="text-xs text-gray-500 font-semibold leading-relaxed mt-2">
                  {addr.houseNumber}, {addr.street}
                  {addr.landmark && `, Near ${addr.landmark}`}
                  <br />
                  {addr.city}, {addr.district}
                  <br />
                  {addr.state} - {addr.pincode}
                  <br />
                  {addr.country}
                </p>
              </div>

              <div className="border-t border-gray-100 pt-4 mt-4 flex justify-between items-center">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold">
                  <Phone size={12} className="text-gray-400" />
                  <span>{addr.mobileNumber}</span>
                  {addr.alternateMobileNumber && (
                    <span className="text-gray-300">/ {addr.alternateMobileNumber}</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEditForm(addr)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition cursor-pointer"
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

      {/* Slide-over Form Drawer */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsFormOpen(false)} />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
              
              {/* Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-green-950 text-white">
                <div>
                  <h3 className="text-lg font-black">{editingAddress ? "Edit Address" : "Add Address Details"}</h3>
                  <p className="text-[10px] text-green-300 font-bold mt-0.5">Please fill out standard postal delivery fields</p>
                </div>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-2 text-green-300 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Scrollable Form */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Address Type</label>
                    <select
                      value={addressType}
                      onChange={(e) => setAddressType(e.target.value)}
                      className="border border-gray-200 p-3.5 rounded-xl text-xs bg-white font-bold text-gray-700 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
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
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer h-4 w-4"
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
                    className="border border-gray-200 p-3.5 rounded-xl text-xs focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Mobile Number</label>
                    <input
                      type="tel"
                      placeholder="10-digit number"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      className="border border-gray-200 p-3.5 rounded-xl text-xs focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                      required
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Alt Mobile (Optional)</label>
                    <input
                      type="tel"
                      placeholder="Alternate contact"
                      value={alternateMobileNumber}
                      onChange={(e) => setAlternateMobileNumber(e.target.value)}
                      className="border border-gray-200 p-3.5 rounded-xl text-xs focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1 pl-1">House/Flat/Shop Number</label>
                  <input
                    type="text"
                    placeholder="H-No, Flat Details, Building Name"
                    value={houseNumber}
                    onChange={(e) => setHouseNumber(e.target.value)}
                    className="border border-gray-200 p-3.5 rounded-xl text-xs focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    required
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Street Address</label>
                  <input
                    type="text"
                    placeholder="Area, Colony, Sector, Street Name"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="border border-gray-200 p-3.5 rounded-xl text-xs focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    required
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Landmark (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Near Hanuman Mandir"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    className="border border-gray-200 p-3.5 rounded-xl text-xs focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Village/City</label>
                    <input
                      type="text"
                      placeholder="Town / City"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="border border-gray-200 p-3.5 rounded-xl text-xs focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                      required
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-gray-500 mb-1 pl-1">District</label>
                    <input
                      type="text"
                      placeholder="District Name"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="border border-gray-200 p-3.5 rounded-xl text-xs focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
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
                      className="border border-gray-200 p-3.5 rounded-xl text-xs focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
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
                      className="border border-gray-200 p-3.5 rounded-xl text-xs focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-gray-500 mb-1 pl-1">Country</label>
                    <input
                      type="text"
                      placeholder="Country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="border border-gray-200 p-3.5 rounded-xl text-xs bg-gray-50 text-gray-400 focus:outline-none font-bold"
                      readOnly
                    />
                  </div>
                </div>
              </form>

              {/* Action Buttons */}
              <div className="p-6 border-t border-gray-100 flex gap-4 bg-gray-50">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 py-3.5 border border-gray-200 text-gray-600 hover:bg-gray-100 rounded-xl font-bold transition text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 py-3.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-xl font-bold transition text-xs flex items-center justify-center cursor-pointer shadow"
                >
                  {submitting ? (
                    <span className="w-4.5 h-4.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : editingAddress ? (
                    "Save Changes"
                  ) : (
                    "Add Address"
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
