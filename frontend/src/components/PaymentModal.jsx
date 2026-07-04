import React, { useState, useEffect } from "react";
import { 
  X, ShieldCheck, CreditCard, Landmark, Wallet, Smartphone, AlertCircle, 
  CheckCircle, Loader2, ArrowRight, QrCode, Clipboard, Check 
} from "lucide-react";
import api, { formatPrice } from "../services/api";

export default function PaymentModal({ isOpen, onClose, orderPayload, previewTotals, userId, user, onSuccess }) {
  if (!isOpen) return null;

  // Configuration and payment methods toggles
  const [config, setConfig] = useState({ codEnabled: true, bankTransferEnabled: true });
  const [activeTab, setActiveTab] = useState("UPI");
  const [selectedUpiApp, setSelectedUpiApp] = useState("Google Pay");
  const [selectedWallet, setSelectedWallet] = useState("Paytm");
  const [selectedBank, setSelectedBank] = useState("SBI");
  
  // Card Form State
  const [cardDetails, setCardDetails] = useState({
    number: "",
    expiry: "",
    cvv: "",
    name: ""
  });

  // Flow State
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [createdOrderNumber, setCreatedOrderNumber] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  // Simulation State (for mock keys)
  const [showMockSimulation, setShowMockSimulation] = useState(false);
  const [mockSimDetails, setMockSimDetails] = useState(null);

  // Fetch payment toggles from backend
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await api.get("/payments/config");
        setConfig(res.data?.data || res.data || { codEnabled: true, bankTransferEnabled: true });
      } catch (err) {
        console.error("Failed to load payment config, using defaults:", err);
      }
    };
    fetchConfig();
  }, []);

  // Scroll lock background content when modal is mounted/open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handleCardChange = (e) => {
    const { name, value } = e.target;
    setCardDetails(prev => ({ ...prev, [name]: value }));
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

  const handleCopyUPI = () => {
    navigator.clipboard.writeText("smartkrishi@okicici");
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Main payment processing flow
  const handlePaymentSubmit = async () => {
    setLoading(true);
    setError("");
    setStatusMessage("Creating your order securely...");

    try {
      // 1. Create order on the backend
      const orderRes = await api.post("/orders", orderPayload);
      const order = orderRes.data?.data || orderRes.data;
      setCreatedOrderNumber(order.orderNumber);

      // Determine payment method code
      let methodCode = activeTab;
      if (activeTab === "UPI") {
        methodCode = `UPI_${selectedUpiApp.toUpperCase().replace(/\s+/g, "_")}`;
      } else if (activeTab === "WALLET") {
        methodCode = `WALLET_${selectedWallet.toUpperCase()}`;
      } else if (activeTab === "NETBANKING") {
        methodCode = `NETBANKING_${selectedBank.toUpperCase()}`;
      }

      setStatusMessage("Initializing payment transaction...");
      // 2. Create payment record on the backend
      const paymentRes = await api.post("/payments", {
        orderId: order.id,
        amount: order.totalAmount,
        paymentMethod: methodCode,
        currency: "INR"
      });
      const paymentDetails = paymentRes.data?.data || paymentRes.data;

      // 3. Handle COD and Bank Transfer directly (Bypass Razorpay)
      const isOffline = activeTab === "COD" || activeTab === "BANK_TRANSFER";
      if (isOffline) {
        setStatusMessage("Confirming order details...");
        
        // Wait briefly for a natural UI transition
        await new Promise(resolve => setTimeout(resolve, 800));

        // Call verification with dummy transaction ID to settle payment status
        const mockTxn = `offline_${activeTab.toLowerCase()}_` + Math.random().toString(36).substring(2, 14);
        await api.post(`/payments/${paymentDetails.id}/verify?transactionId=${mockTxn}`);
        
        setSuccess(true);
        setLoading(false);
        setTimeout(() => {
          onSuccess(order.id);
        }, 2000);
        return;
      }

      // 4. Online payment flow
      const isMockKey = !paymentDetails.razorpayKeyId || 
                         paymentDetails.razorpayKeyId === "key_id" || 
                         paymentDetails.razorpayKeyId === "your-key-id";

      if (isMockKey) {
        // If keys are mock, switch to sandbox simulation within the modal
        setStatusMessage("");
        setMockSimDetails({
          paymentId: paymentDetails.id,
          orderId: order.id,
          orderNumber: order.orderNumber,
          amount: order.totalAmount,
          methodCode
        });
        setShowMockSimulation(true);
        setLoading(false);
      } else {
        // Live Razorpay payment gateway popup flow
        setStatusMessage("Opening Razorpay Secure Window...");
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          throw new Error("Unable to load Razorpay SDK. Please check your network connection.");
        }

        const options = {
          key: paymentDetails.razorpayKeyId,
          amount: Math.round(paymentDetails.amount * 100), // in paise
          currency: paymentDetails.currency || "INR",
          name: "Smart Krishi",
          description: `Order Payment: ${order.orderNumber}`,
          order_id: paymentDetails.razorpayOrderId,
          prefill: {
            name: user?.name || "",
            email: user?.email || "",
            contact: user?.mobileNumber || ""
          },
          theme: {
            color: "#059669"
          },
          handler: async function (response) {
            setLoading(true);
            setStatusMessage("Cryptographically verifying payment...");
            try {
              await api.post(`/payments/${paymentDetails.id}/verify`, null, {
                params: {
                  transactionId: response.razorpay_payment_id,
                  signature: response.razorpay_signature
                }
              });
              setSuccess(true);
              setLoading(false);
              setTimeout(() => {
                onSuccess(order.id);
              }, 2000);
            } catch (err) {
              console.error("Verification failed:", err);
              setError("Payment verification failed. Please contact customer support.");
              setLoading(false);
            }
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
              setError("Payment canceled by user.");
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || "Failed to process transaction. Verify stock level.");
      setLoading(false);
    }
  };

  const handleConfirmMockSettle = async () => {
    setLoading(true);
    setError("");
    setStatusMessage("Verifying mock transaction signature...");
    try {
      const mockPaymentId = "pay_sim_" + Math.random().toString(36).substring(2, 16);
      const mockSignature = "sig_sim_" + Math.random().toString(36).substring(2, 16);

      await api.post(`/payments/${mockSimDetails.paymentId}/verify?transactionId=${mockPaymentId}&signature=${mockSignature}`);
      
      setSuccess(true);
      setShowMockSimulation(false);
      setLoading(false);
      setTimeout(() => {
        onSuccess(mockSimDetails.orderId);
      }, 2000);
    } catch (err) {
      console.error(err);
      setError("Mock verification failed.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#06150F]/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
      {/* Centered Premium Container */}
      <div className="bg-white rounded-[32px] max-w-4xl w-full overflow-y-auto md:overflow-hidden shadow-2xl border border-emerald-100/50 flex flex-col md:flex-row relative animate-scaleUp max-h-[90vh]">
        
        {/* Close Button */}
        {!loading && !success && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 p-2.5 rounded-full transition z-10"
          >
            <X size={18} />
          </button>
        )}

        {/* Left Section: Order Invoice Summary */}
        <div className="md:w-5/12 bg-gradient-to-b from-emerald-950 to-green-900 p-8 text-white flex flex-col justify-between select-none">
          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300 bg-emerald-900/50 px-3 py-1 rounded-full">
                Secure Checkout
              </span>
              <h2 className="text-2xl font-black tracking-tight mt-3">Order Invoice</h2>
              <p className="text-xs text-emerald-100/70 font-semibold mt-1">Smart Krishi verified billing gateway</p>
            </div>

            <div className="border-t border-emerald-800/60 pt-6 space-y-4 text-xs font-bold text-emerald-100">
              <div className="flex justify-between">
                <span>Product Total</span>
                <span>{formatPrice(previewTotals.subtotalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Platform Fee</span>
                <span>{formatPrice(previewTotals.platformFee)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>{formatPrice(previewTotals.shippingCharge)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (GST)</span>
                <span>{formatPrice(previewTotals.taxAmount)}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-emerald-800/80 pt-6 mt-8">
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider block">Grand Total</span>
            <div className="text-3xl font-black text-white flex items-baseline gap-1 mt-1">
              <span>{formatPrice(previewTotals.totalAmount)}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-4 text-[10px] text-emerald-300 font-bold bg-emerald-900/40 p-2.5 rounded-xl border border-emerald-800/40">
              <ShieldCheck size={14} className="flex-shrink-0" />
              <span>TLS 1.3 Encryption Active</span>
            </div>
          </div>
        </div>

        {/* Right Section: Interactive Payment Selector */}
        <div className="md:w-7/12 p-8 flex flex-col justify-between overflow-y-visible md:overflow-y-auto md:max-h-[80vh]">
          {success ? (
            /* Success State Animation */
            <div className="flex flex-col items-center justify-center text-center space-y-4 py-12 h-full">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 animate-bounce">
                <CheckCircle size={54} />
              </div>
              <h3 className="text-2xl font-black text-emerald-950">Payment Successful!</h3>
              <p className="text-sm font-semibold text-gray-500 max-w-xs">
                Your order <strong className="text-emerald-900 font-black">#{createdOrderNumber || "SUCCESS"}</strong> is verified and accepted. Redirecting to tracking center...
              </p>
            </div>
          ) : loading ? (
            /* Loading State Animation */
            <div className="flex flex-col items-center justify-center text-center space-y-4 py-12 h-full">
              <Loader2 className="animate-spin text-emerald-600" size={54} />
              <h3 className="text-lg font-black text-emerald-950">Processing Settle Request</h3>
              <p className="text-xs font-bold text-gray-400">{statusMessage}</p>
            </div>
          ) : showMockSimulation ? (
            /* Simulated Mock Sandbox UI */
            <div className="space-y-6 py-4">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="text-xl font-extrabold text-emerald-950">Razorpay Simulation</h3>
                <p className="text-xs text-gray-400 font-bold">Mock Sandbox environment activated.</p>
              </div>

              <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100/30 text-xs font-bold text-emerald-950 space-y-2">
                <div className="flex justify-between">
                  <span>Order Reference:</span>
                  <span>{mockSimDetails.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Settlement Method:</span>
                  <span className="font-extrabold text-emerald-800">{mockSimDetails.methodCode}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span className="font-extrabold text-emerald-800">{formatPrice(mockSimDetails.amount)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowMockSimulation(false);
                    setError("Payment simulation aborted.");
                  }}
                  className="py-3 border border-red-200 hover:bg-red-50 text-red-600 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel & Decline
                </button>
                <button
                  type="button"
                  onClick={handleConfirmMockSettle}
                  className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer"
                >
                  Confirm mock payment
                </button>
              </div>
            </div>
          ) : (
            /* Standard Payment Selection Interface */
            <div className="space-y-6 flex flex-col justify-between h-full">
              <div>
                <h3 className="text-xl font-black text-emerald-950">Select Payment Method</h3>
                <p className="text-xs font-semibold text-gray-400">Choose your preferred transaction coordinates</p>

                {error && (
                  <div className="bg-red-50 border border-red-250 text-red-800 p-3.5 rounded-2xl flex items-center gap-2.5 text-xs font-bold mt-4 animate-scaleUp">
                    <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                 {/* Tabs Split */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-6">
                  {[
                    { id: "UPI", label: "UPI Apps", icon: Smartphone },
                    { id: "CREDIT_CARD", label: "Credit Card", icon: CreditCard },
                    { id: "DEBIT_CARD", label: "Debit Card", icon: CreditCard },
                    { id: "NETBANKING", label: "Net Banking", icon: Landmark },
                    { id: "WALLET", label: "Wallet", icon: Wallet },
                    ...(config.codEnabled ? [{ id: "COD", label: "COD", icon: CheckCircle }] : []),
                    ...(config.bankTransferEnabled ? [{ id: "BANK_TRANSFER", label: "Bank Transfer", icon: Landmark }] : [])
                  ].map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                          isActive 
                            ? "border-emerald-600 bg-emerald-50/30 text-emerald-800 shadow-sm" 
                            : "border-gray-200 hover:border-gray-300 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        <Icon size={16} className={isActive ? "text-emerald-600" : "text-gray-400"} />
                        <span className="text-[10px] font-black uppercase tracking-wider">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Details Config Area */}
                <div className="mt-6 border border-gray-150 rounded-2xl p-4 bg-gray-50/30 animate-fadeIn min-h-[160px]">
                  
                  {/* UPI Details Tab */}
                  {activeTab === "UPI" && (
                    <div className="space-y-4">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-0.5">UPI Applications</span>
                      <div className="grid grid-cols-2 gap-2">
                        {["Google Pay", "PhonePe", "Paytm", "BHIM", "Amazon Pay"].map(app => {
                          const isSelected = selectedUpiApp === app;
                          return (
                            <button
                              key={app}
                              type="button"
                              onClick={() => setSelectedUpiApp(app)}
                              className={`p-2.5 rounded-xl border text-left text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                                isSelected 
                                  ? "border-emerald-600 bg-white text-emerald-950 shadow-sm" 
                                  : "border-gray-200 bg-white hover:border-gray-300 text-gray-600"
                              }`}
                            >
                              <span>{app}</span>
                              {isSelected && <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></div>}
                            </button>
                          );
                        })}
                      </div>
                      <div className="text-[10px] text-emerald-800 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100/30 leading-relaxed font-medium">
                        Instant mobile app request deep link will be initiated on confirmation.
                      </div>
                    </div>
                  )}

                  {/* Cards Details Tab */}
                  {(activeTab === "CREDIT_CARD" || activeTab === "DEBIT_CARD") && (
                    <div className="space-y-3">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-0.5">
                        {activeTab === "CREDIT_CARD" ? "Credit Card Coordinates" : "Debit Card Coordinates"}
                      </span>
                      <div className="space-y-2">
                        <input
                          type="text"
                          name="number"
                          placeholder="Card Number (e.g. 4321 0987 6543 2100)"
                          value={cardDetails.number}
                          onChange={handleCardChange}
                          className="w-full p-2.5 border border-gray-200 bg-white rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-bold placeholder:text-gray-300"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            name="expiry"
                            placeholder="MM/YY"
                            value={cardDetails.expiry}
                            onChange={handleCardChange}
                            className="p-2.5 border border-gray-200 bg-white rounded-xl text-xs text-center focus:ring-1 focus:ring-emerald-500 font-bold placeholder:text-gray-300"
                          />
                          <input
                            type="password"
                            name="cvv"
                            maxLength="3"
                            placeholder="CVV"
                            value={cardDetails.cvv}
                            onChange={handleCardChange}
                            className="p-2.5 border border-gray-200 bg-white rounded-xl text-xs text-center focus:ring-1 focus:ring-emerald-500 font-bold placeholder:text-gray-300"
                          />
                        </div>
                        <input
                          type="text"
                          name="name"
                          placeholder="Cardholder Name"
                          value={cardDetails.name}
                          onChange={handleCardChange}
                          className="w-full p-2.5 border border-gray-200 bg-white rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 font-bold placeholder:text-gray-300"
                        />
                      </div>
                    </div>
                  )}

                  {/* Net Banking Details Tab */}
                  {activeTab === "NETBANKING" && (
                    <div className="space-y-4">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-0.5">Major Commercial Banks</span>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { code: "SBI", name: "State Bank of India" },
                          { code: "HDFC", name: "HDFC Bank" },
                          { code: "ICICI", name: "ICICI Bank" },
                          { code: "AXIS", name: "Axis Bank" }
                        ].map(bank => {
                          const isSelected = selectedBank === bank.code;
                          return (
                            <button
                              key={bank.code}
                              onClick={() => setSelectedBank(bank.code)}
                              className={`p-3 rounded-xl border text-left text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                                isSelected 
                                  ? "border-emerald-600 bg-white text-emerald-950 shadow-sm" 
                                  : "border-gray-200 bg-white hover:border-gray-300 text-gray-600"
                              }`}
                            >
                              <span>{bank.name}</span>
                              {isSelected && <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></div>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Wallets Details Tab */}
                  {activeTab === "WALLET" && (
                    <div className="space-y-4">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-0.5">Associated Wallets</span>
                      <div className="grid grid-cols-2 gap-2">
                        {["Paytm Wallet", "Amazon Pay Wallet", "PhonePe Wallet", "MobiKwik"].map(wallet => {
                          const isSelected = selectedWallet === wallet;
                          return (
                            <button
                              key={wallet}
                              onClick={() => setSelectedWallet(wallet)}
                              className={`p-3 rounded-xl border text-left text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                                isSelected 
                                  ? "border-emerald-600 bg-white text-emerald-950 shadow-sm" 
                                  : "border-gray-200 bg-white hover:border-gray-300 text-gray-600"
                              }`}
                            >
                              <span>{wallet}</span>
                              {isSelected && <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></div>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Cash On Delivery Tab */}
                  {activeTab === "COD" && (
                    <div className="flex items-start gap-3 p-2 font-medium">
                      <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                        <CheckCircle size={20} />
                      </div>
                      <div className="space-y-1">
                        <span className="text-sm font-bold text-emerald-950">Cash On Delivery Selected</span>
                        <p className="text-[11px] text-gray-400 leading-normal">
                          Settle your transaction total using cash, cards, or scanning the delivery executive's UPI QR Code when the shipment arrives at your destination.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Bank Transfer Tab */}
                  {activeTab === "BANK_TRANSFER" && (
                    <div className="space-y-3 font-semibold">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-0.5">Official Escrow Account Details</span>
                      <div className="bg-white border border-gray-150 p-3 rounded-xl space-y-1.5 text-xs text-emerald-950">
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-[10px]">Beneficiary Name:</span>
                          <span className="font-extrabold text-[11px]">Smart Krishi Pvt Ltd</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-[10px]">Account Number:</span>
                          <span className="font-extrabold text-[11px]">987654321098</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-[10px]">IFSC Code:</span>
                          <span className="font-extrabold text-[11px]">ICIC0000104</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-[10px]">Branch:</span>
                          <span className="font-extrabold text-[11px]">Connaught Place, New Delhi</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[10px] bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100/30 text-emerald-800">
                        <div className="flex items-center gap-1.5">
                          <QrCode size={14} />
                          <span>Simulation Account VPA: <strong className="font-black">smartkrishi@okicici</strong></span>
                        </div>
                        <button 
                          onClick={handleCopyUPI}
                          className="hover:bg-emerald-100 p-1 rounded transition text-emerald-700 cursor-pointer"
                        >
                          {isCopied ? <Check size={12} /> : <Clipboard size={12} />}
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* Settle Action Button */}
              <button
                onClick={handlePaymentSubmit}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-4 rounded-2xl shadow-lg shadow-emerald-100/50 flex items-center justify-center gap-2 group transition duration-300 mt-6 cursor-pointer"
              >
                <span>Authorize & Pay</span>
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
