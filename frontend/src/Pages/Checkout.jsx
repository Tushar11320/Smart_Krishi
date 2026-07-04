import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, MapPin, CheckCircle, AlertCircle, RefreshCw, Landmark, CreditCard, Wallet, Smartphone, Plus, ArrowLeft } from "lucide-react";
import api, { formatPrice } from "../services/api";
import PaymentModal from "../components/PaymentModal";

export default function Checkout() {
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [activeItems, setActiveItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);
  
  // Checkout Preview Calculations (calculated purely on backend)
  const [previewTotals, setPreviewTotals] = useState(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Inline New Address Form State
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: "",
    mobileNumber: "",
    alternateMobileNumber: "",
    houseNumber: "",
    street: "",
    landmark: "",
    city: "",
    district: "",
    state: "",
    pincode: "",
    country: "India",
    addressType: "HOME",
    isDefault: false
  });
  const [addressSaving, setAddressSaving] = useState(false);

  const getLoggedInUser = () => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  };

  const user = getLoggedInUser();
  const userId = user?.id;

  // 1. Fetch user addresses and active cart items
  const fetchCheckoutData = async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      // Fetch user addresses
      const addrRes = await api.get(`/addresses/user/${userId}`);
      const addrList = addrRes.data?.data || addrRes.data || [];
      setAddresses(addrList);
      
      const defaultAddr = addrList.find(addr => addr.isDefault) || addrList[0] || null;
      setSelectedAddress(defaultAddr);

      // Fetch active items in cart
      const cartRes = await api.get(`/cart/${userId}`);
      const cartData = cartRes.data?.data || cartRes.data;
      const items = cartData.cartItems || [];
      
      // Filter out saved items
      const active = items.filter(item => !item.saveForLater);
      setActiveItems(active);

      if (active.length === 0) {
        setError("Your shopping cart is empty. Please add items before checking out.");
        setTimeout(() => navigate("/cart"), 2000);
      }
    } catch (err) {
      console.error("Failed to load checkout details:", err);
      setError("Unable to load checkout details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) {
      setError("Please log in to checkout.");
      setTimeout(() => navigate("/account"), 1500);
      return;
    }
    fetchCheckoutData();
  }, [userId]);

  // 2. Fetch Order Preview Calculations (Secure Backend Calculation)
  const fetchOrderPreview = async () => {
    if (!userId || activeItems.length === 0 || !selectedAddress) {
      setPreviewTotals(null);
      return;
    }
    setIsPreviewLoading(true);
    try {
      const fullAddressStr = `${selectedAddress.fullName}, ${selectedAddress.houseNumber}, ${selectedAddress.street}${selectedAddress.landmark ? ", Near " + selectedAddress.landmark : ""}, ${selectedAddress.city}, ${selectedAddress.district}, ${selectedAddress.state} - ${selectedAddress.pincode} (Ph: ${selectedAddress.mobileNumber}${selectedAddress.alternateMobileNumber ? " / Alt: " + selectedAddress.alternateMobileNumber : ""})`;
      
      const previewPayload = {
        buyerId: userId,
        shippingAddress: fullAddressStr,
        discountAmount: 0,
        orderItems: activeItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }))
      };

      const res = await api.post("/orders/preview", previewPayload);
      setPreviewTotals(res.data?.data || res.data);
    } catch (err) {
      console.error("Calculation preview failed:", err);
      setError("Failed to fetch verified order totals from backend.");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  useEffect(() => {
    if (selectedAddress && activeItems.length > 0) {
      fetchOrderPreview();
    }
  }, [selectedAddress, activeItems]);

  // 3. Create Address Inline
  const handleCreateAddress = async (e) => {
    e.preventDefault();
    if (
      !newAddress.fullName ||
      !newAddress.mobileNumber ||
      !newAddress.houseNumber ||
      !newAddress.street ||
      !newAddress.city ||
      !newAddress.district ||
      !newAddress.state ||
      !newAddress.pincode
    ) {
      setError("Please fill all required address fields.");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(newAddress.mobileNumber)) {
      setError("Mobile number must be a valid 10-digit number starting with 6-9");
      return;
    }
    if (newAddress.alternateMobileNumber && !/^[6-9]\d{9}$/.test(newAddress.alternateMobileNumber)) {
      setError("Alternate mobile number must be a valid 10-digit number starting with 6-9");
      return;
    }
    if (!/^[1-9]\d{5}$/.test(newAddress.pincode)) {
      setError("Pincode must be a valid 6-digit number");
      return;
    }

    setAddressSaving(true);
    setError("");
    try {
      const payload = {
        ...newAddress,
        userId: userId
      };
      const res = await api.post("/addresses", payload);
      const createdAddr = res.data?.data || res.data;
      
      setAddresses(prev => [createdAddr, ...prev]);
      setSelectedAddress(createdAddr);
      setShowNewAddressForm(false);
      setSuccess("Address saved successfully!");
      // Reset form
      setNewAddress({
        fullName: "",
        mobileNumber: "",
        alternateMobileNumber: "",
        houseNumber: "",
        street: "",
        landmark: "",
        city: "",
        district: "",
        state: "",
        pincode: "",
        country: "India",
        addressType: "HOME",
        isDefault: false
      });
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to save address.");
    } finally {
      setAddressSaving(false);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // 4. Initiate Order Placement (Trigger payment selection modal)
  const handleInitiateOrder = () => {
    if (!selectedAddress) {
      setError("Please select a shipping address.");
      return;
    }
    if (!previewTotals) {
      setError("Order calculation totals are not verified yet.");
      return;
    }
    setError("");
    setSuccess("");
    setShowPaymentModal(true);
  };

  const fullAddressStr = selectedAddress 
    ? `${selectedAddress.fullName}, ${selectedAddress.houseNumber}, ${selectedAddress.street}${selectedAddress.landmark ? ", Near " + selectedAddress.landmark : ""}, ${selectedAddress.city}, ${selectedAddress.district}, ${selectedAddress.state} - ${selectedAddress.pincode} (Ph: ${selectedAddress.mobileNumber}${selectedAddress.alternateMobileNumber ? " / Alt: " + selectedAddress.alternateMobileNumber : ""})` 
    : "";

  const orderPayload = (previewTotals && selectedAddress) ? {
    buyerId: userId,
    subtotalAmount: previewTotals.subtotalAmount,
    discountAmount: 0,
    taxAmount: previewTotals.taxAmount,
    shippingCharge: previewTotals.shippingCharge,
    totalAmount: previewTotals.totalAmount,
    shippingAddress: fullAddressStr,
    orderItems: activeItems.map(item => ({
      productId: item.productId,
      quantity: item.quantity
    }))
  } : null;

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-emerald-950 font-bold font-outfit">Loading checkout details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] p-4 md:p-8 font-outfit">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Back and Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/cart")}
            className="p-2 border border-gray-255 rounded-xl hover:bg-gray-50 text-gray-600 transition"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-3xl font-extrabold text-emerald-950">Secure Checkout</h1>
            <p className="text-sm text-gray-500">Provide shipping coordinates and settle secure payment.</p>
          </div>
        </div>

        {/* Notifications */}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-3 font-semibold animate-fadeIn">
            <CheckCircle className="text-emerald-600 flex-shrink-0" size={20} />
            <div className="text-sm">{success}</div>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl flex items-center gap-3 font-semibold animate-fadeIn">
            <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
            <div className="text-sm">{error}</div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Checkout Steps */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Step 1: Address Selection */}
            <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h2 className="text-lg font-bold text-emerald-950 flex items-center gap-2">
                  <MapPin className="text-emerald-600" size={20} />
                  Shipping Destination
                </h2>
                {!showNewAddressForm && (
                  <button
                    onClick={() => setShowNewAddressForm(true)}
                    className="text-emerald-700 hover:text-emerald-800 text-xs font-bold flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100/80 px-3 py-1.5 rounded-lg transition"
                  >
                    <Plus size={14} /> Add Address
                  </button>
                )}
              </div>

              {/* Inline Address Creation Form */}
              {showNewAddressForm && (
                <form onSubmit={handleCreateAddress} className="bg-gray-50/50 p-5 rounded-2xl border border-gray-150 space-y-4 animate-scaleUp">
                  <h3 className="text-sm font-bold text-emerald-950">Add a New Address</h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ram Prasad"
                        value={newAddress.fullName}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, fullName: e.target.value }))}
                        className="border border-gray-250 p-2.5 rounded-xl text-sm bg-white"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1">Mobile Number *</label>
                      <input
                        type="text"
                        required
                        placeholder="10-digit mobile number"
                        value={newAddress.mobileNumber}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, mobileNumber: e.target.value }))}
                        className="border border-gray-250 p-2.5 rounded-xl text-sm bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1">Alt Mobile Number</label>
                      <input
                        type="text"
                        placeholder="Optional alternate mobile"
                        value={newAddress.alternateMobileNumber}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, alternateMobileNumber: e.target.value }))}
                        className="border border-gray-250 p-2.5 rounded-xl text-sm bg-white"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1">House/Flat Number *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 404, Building A"
                        value={newAddress.houseNumber}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, houseNumber: e.target.value }))}
                        className="border border-gray-250 p-2.5 rounded-xl text-sm bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1">Street Address *</label>
                      <input
                        type="text"
                        required
                        placeholder="Road, Area, Locality"
                        value={newAddress.street}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, street: e.target.value }))}
                        className="border border-gray-250 p-2.5 rounded-xl text-sm bg-white"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1">Landmark</label>
                      <input
                        type="text"
                        placeholder="e.g. Near Hanuman Temple"
                        value={newAddress.landmark}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, landmark: e.target.value }))}
                        className="border border-gray-250 p-2.5 rounded-xl text-sm bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="flex flex-col col-span-2">
                      <label className="text-xs font-bold text-gray-500 mb-1">Village/City *</label>
                      <input
                        type="text"
                        required
                        placeholder="City"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, city: e.target.value }))}
                        className="border border-gray-250 p-2.5 rounded-xl text-sm bg-white"
                      />
                    </div>
                    <div className="flex flex-col col-span-1">
                      <label className="text-xs font-bold text-gray-500 mb-1">District *</label>
                      <input
                        type="text"
                        required
                        placeholder="District"
                        value={newAddress.district}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, district: e.target.value }))}
                        className="border border-gray-250 p-2.5 rounded-xl text-sm bg-white"
                      />
                    </div>
                    <div className="flex flex-col col-span-1">
                      <label className="text-xs font-bold text-gray-500 mb-1">State *</label>
                      <input
                        type="text"
                        required
                        placeholder="State"
                        value={newAddress.state}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, state: e.target.value }))}
                        className="border border-gray-250 p-2.5 rounded-xl text-sm bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1">Pincode *</label>
                      <input
                        type="text"
                        required
                        placeholder="6-digit PIN"
                        value={newAddress.pincode}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, pincode: e.target.value }))}
                        className="border border-gray-250 p-2.5 rounded-xl text-sm bg-white"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1">Country</label>
                      <input
                        type="text"
                        placeholder="Country"
                        value={newAddress.country}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, country: e.target.value }))}
                        className="border border-gray-250 p-2.5 rounded-xl text-sm bg-gray-50 text-gray-400 font-bold"
                        readOnly
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-gray-500 mb-1">Address Type</label>
                      <select
                        value={newAddress.addressType}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, addressType: e.target.value }))}
                        className="border border-gray-250 p-2.5 rounded-xl text-sm bg-white font-bold text-emerald-950"
                      >
                        <option value="HOME">Home</option>
                        <option value="FARM">Farm</option>
                        <option value="OFFICE">Office</option>
                        <option value="WAREHOUSE">Warehouse</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="isDefault"
                      checked={newAddress.isDefault}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, isDefault: e.target.checked }))}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <label htmlFor="isDefault" className="text-xs font-bold text-gray-600 cursor-pointer">Set as Default Address</label>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowNewAddressForm(false)}
                      className="px-4 py-2 border border-gray-200 hover:bg-gray-100 text-gray-600 font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={addressSaving}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
                    >
                      {addressSaving ? "Saving..." : "Save Address"}
                    </button>
                  </div>
                </form>
              )}

              {/* Address List */}
              {addresses.length === 0 ? (
                <div className="p-4 border border-dashed border-gray-300 rounded-2xl text-center text-sm font-bold text-gray-400">
                  No saved addresses found. Please add an address to ship your orders.
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((addr) => {
                    const isSelected = selectedAddress?.id === addr.id;
                    return (
                      <div
                        key={addr.id}
                        onClick={() => setSelectedAddress(addr)}
                        className={`p-4 rounded-2xl border transition duration-200 cursor-pointer relative flex items-start gap-3 ${
                          isSelected
                            ? "border-emerald-600 bg-emerald-50/20"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="address"
                          checked={isSelected}
                          onChange={() => setSelectedAddress(addr)}
                          className="mt-1 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-emerald-950 text-sm">{addr.fullName}</span>
                            <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full">
                              {addr.addressType}
                            </span>
                            {addr.isDefault && (
                              <span className="bg-amber-50 text-amber-800 text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                            {addr.houseNumber}, {addr.street}{addr.landmark && `, Near ${addr.landmark}`}, {addr.city}, {addr.district}, {addr.state} - {addr.pincode}
                          </p>
                          <p className="text-xs text-gray-400 font-bold">
                            Contact: {addr.mobileNumber}
                            {addr.alternateMobileNumber && ` / Alt: ${addr.alternateMobileNumber}`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step 2: Items Preview */}
            <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-emerald-950 border-b border-gray-100 pb-3">
                Order Items Preview
              </h2>
              <div className="space-y-3">
                {activeItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-emerald-950 w-6 text-center text-xs bg-gray-50 border border-gray-150 p-1.5 rounded-lg">
                        {item.quantity}x
                      </span>
                      <span className="font-bold text-emerald-950">{item.productName}</span>
                    </div>
                    <span className="font-extrabold text-emerald-700">{formatPrice(item.subtotal)}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Secure Order Summary Card */}
          <div className="space-y-6">
            <div className="bg-white rounded-[32px] shadow-sm border border-gray-150 p-6 space-y-6 relative">
              {isPreviewLoading && (
                <div className="absolute inset-0 bg-white/70 rounded-[32px] flex items-center justify-center z-10">
                  <div className="text-center space-y-2">
                    <RefreshCw className="animate-spin text-emerald-600 mx-auto" size={24} />
                    <span className="text-xs font-bold text-emerald-950">Recalculating secure prices...</span>
                  </div>
                </div>
              )}

              <h2 className="text-xl font-extrabold text-emerald-950 border-b border-gray-200/60 pb-4">Secure Billing</h2>

              {previewTotals ? (
                <div className="space-y-4 text-xs font-bold text-gray-500">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-extrabold text-emerald-950 text-sm">
                      {formatPrice(previewTotals.subtotalAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform Fee</span>
                    <span className="font-extrabold text-emerald-950 text-sm">
                      {formatPrice(previewTotals.platformFee)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST / Tax (5%)</span>
                    <span className="font-extrabold text-emerald-950 text-sm">
                      {formatPrice(previewTotals.taxAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping Rate</span>
                    <span className="font-extrabold text-emerald-950 text-sm">
                      {formatPrice(previewTotals.shippingCharge)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-gray-100 pt-4 text-lg font-black text-emerald-800">
                    <span>Final Amount</span>
                    <span>{formatPrice(previewTotals.totalAmount)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400 font-bold text-center py-4">
                  Select a shipping destination to compute billing totals.
                </p>
              )}

              <div className="flex items-start gap-2.5 text-emerald-800 bg-emerald-50 p-4 rounded-2xl text-xs font-semibold leading-relaxed">
                <ShieldCheck size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Enterprise Shield: Totals and rates are signed and validated purely on backend. Client adjustments are ignored.</span>
              </div>

              <button
                onClick={handleInitiateOrder}
                disabled={orderLoading || !selectedAddress || !previewTotals}
                className={`w-full py-4 rounded-2xl text-white font-extrabold shadow-lg flex items-center justify-center gap-2 transition duration-300 ${
                  orderLoading || !selectedAddress || !previewTotals
                    ? "bg-gray-200 text-gray-400 shadow-none cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100/50"
                }`}
              >
                {orderLoading && <RefreshCw size={16} className="animate-spin" />}
                Pay Now
              </button>
            </div>
          </div>

        </div>

      </div>

      {showPaymentModal && previewTotals && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          orderPayload={orderPayload}
          previewTotals={previewTotals}
          userId={userId}
          user={user}
          onSuccess={(orderId) => {
            setShowPaymentModal(false);
            setSuccess("Order placed successfully! Redirecting...");
            setTimeout(() => navigate(`/orders/${orderId}/track`), 1500);
          }}
        />
      )}
    </div>
  );
}
