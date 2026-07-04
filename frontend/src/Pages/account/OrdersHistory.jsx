import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api, { formatPrice } from "../../services/api";
import ReviewsTab from "../../components/ReviewsTab";
import { ShoppingBag, MapPin, AlertCircle, X, CheckCircle } from "lucide-react";

export default function OrdersHistory() {
  const [user, setUser] = useState(null);
  const [buyerOrders, setBuyerOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Review Modal states
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewModalProductId, setReviewModalProductId] = useState(null);
  const [reviewModalSellerId, setReviewModalSellerId] = useState(null);
  const [reviewModalName, setReviewModalName] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      fetchBuyerOrders(parsed.id);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchBuyerOrders = async (userId) => {
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await api.get(`/orders/buyer/${userId}`);
      const content = response.data?.content || response.data?.data?.content || response.data?.data || [];
      setBuyerOrders(Array.isArray(content) ? content : []);
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to fetch order history.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order? 🌾")) return;
    setErrorMessage("");
    setSuccessMessage("");
    try {
      await api.post(`/orders/${orderId}/cancel?reason=Cancelled by buyer`);
      setSuccessMessage("Order cancelled successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
      if (user) fetchBuyerOrders(user.id);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.response?.data?.message || "Failed to cancel order.");
    }
  };

  const handleReturnOrder = async (orderId) => {
    const reason = window.prompt("Please enter the reason for return: 🌾");
    if (reason === null) return;
    if (!reason.trim()) {
      alert("Return reason is required.");
      return;
    }
    setErrorMessage("");
    setSuccessMessage("");
    try {
      await api.post(`/orders/${orderId}/return?reason=${encodeURIComponent(reason)}`);
      setSuccessMessage("Order return request submitted successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
      if (user) fetchBuyerOrders(user.id);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.response?.data?.message || "Failed to return order.");
    }
  };

  const handleOpenReviewModal = (productId, sellerId, name) => {
    setReviewModalProductId(productId);
    setReviewModalSellerId(sellerId);
    setReviewModalName(name);
    setIsReviewModalOpen(true);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-gray-150 shadow">
        <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500 font-medium">Loading your order history...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-8 border border-green-100 shadow-lg space-y-6 animate-fadeIn">
      <div>
        <h3 className="text-2xl font-black text-green-950 flex items-center gap-2">
          <ShoppingBag className="text-green-600" size={24} />
          My Order History
        </h3>
        <p className="text-xs text-gray-400 font-bold mt-1">Track your purchases, view delivery details, or request order cancellations.</p>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl flex items-center gap-3 font-medium text-sm">
          <CheckCircle className="text-green-600" size={20} />
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-center gap-3 font-medium text-sm">
          <AlertCircle className="text-red-600" size={20} />
          {errorMessage}
        </div>
      )}

      {buyerOrders.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
          <h4 className="text-lg font-bold text-gray-700">No orders placed yet</h4>
          <p className="text-sm text-gray-400 mt-1">Explore our marketplace to order crops, machinery, fertilizers, or milk.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {buyerOrders.map((order) => {
            const canCancel = ["PENDING", "ACCEPTED"].includes(order.orderStatus);
            return (
              <div key={order.id} className="border border-gray-150 rounded-3xl p-6 bg-gray-50/30 hover:border-green-200 transition-all duration-300 space-y-4">
                {/* Summary header */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-gray-100 pb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Order Reference</span>
                    <div className="font-extrabold text-green-950 text-sm flex items-center gap-2">
                      {order.orderNumber}
                      <span className={`inline-block text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                        order.orderStatus === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                        order.orderStatus === "ACCEPTED" ? "bg-indigo-100 text-indigo-800" :
                        order.orderStatus === "PACKED" ? "bg-orange-100 text-orange-800" :
                        order.orderStatus === "SHIPPED" ? "bg-purple-100 text-purple-800" :
                        order.orderStatus === "OUT_FOR_DELIVERY" ? "bg-pink-100 text-pink-800" :
                        order.orderStatus === "DELIVERED" ? "bg-green-100 text-green-800" :
                        order.orderStatus === "CANCELLED" ? "bg-red-100 text-red-800" :
                        order.orderStatus === "RETURNED" ? "bg-amber-100 text-amber-800" :
                        order.orderStatus === "REFUNDED" ? "bg-teal-100 text-teal-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {order.orderStatus}
                      </span>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Total Value</span>
                    <div className="font-extrabold text-green-700 text-base">{formatPrice(order.totalAmount)}</div>
                    {order.platformFee > 0 && (
                      <div className="text-[10px] text-gray-400 font-bold mt-0.5">
                        Includes Platform Fee: {formatPrice(order.platformFee)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Items list & shipping info */}
                <div className="grid md:grid-cols-2 gap-4 text-xs font-semibold text-gray-600">
                  <div className="space-y-2 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                    <h4 className="font-bold text-green-950 flex items-center gap-1.5 mb-2">
                      <ShoppingBag size={14} className="text-green-600" /> Items List
                    </h4>
                    {order.orderItems && order.orderItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center py-1 font-bold text-gray-800">
                        <span>{item.productName} (x{item.quantity})</span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">{formatPrice(item.totalPrice)}</span>
                          {order.orderStatus === "DELIVERED" && (
                            <button
                              onClick={() => handleOpenReviewModal(item.productId, null, item.productName)}
                              className="text-[10px] font-black text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-lg transition cursor-pointer"
                            >
                              Review Product
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                    <h4 className="font-bold text-green-950 flex items-center gap-1.5 mb-2">
                      <MapPin size={14} className="text-green-600" /> Shipping Destination
                    </h4>
                    <div><strong className="text-gray-800">Receiver:</strong> {order.buyerName}</div>
                    <div><strong className="text-gray-800">Address:</strong> {order.shippingAddress}</div>
                    {order.sellerName && (
                      <div className="text-xs text-gray-400 font-bold border-t border-gray-50 pt-1.5 mt-1.5 flex justify-between items-center">
                        <span>Seller: <span className="text-green-800">{order.sellerName}</span></span>
                        {order.orderStatus === "DELIVERED" && (
                          <button
                            onClick={() => handleOpenReviewModal(null, order.sellerId, order.sellerName)}
                            className="text-[10px] font-black text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-1 rounded-lg transition cursor-pointer"
                          >
                            Review Seller
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Order actions & Dates */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <div className="text-[11px] text-gray-400 font-bold">
                    Placed on: {new Date(order.createdAt).toLocaleString()}
                  </div>

                  <div className="flex gap-2">
                    {order.orderStatus !== "CANCELLED" && (
                      <Link
                        to={`/orders/${order.id}/track`}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
                      >
                        Track Order 🌾
                      </Link>
                    )}
                    {canCancel && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        className="px-4 py-2 border border-red-200 hover:bg-red-50 text-red-600 font-extrabold text-xs rounded-xl shadow-sm transition"
                      >
                        Cancel Order
                      </button>
                    )}
                    {order.orderStatus === "DELIVERED" && (
                      <button
                        onClick={() => handleReturnOrder(order.id)}
                        className="px-4 py-2 border border-amber-200 hover:bg-amber-50 text-amber-700 font-extrabold text-xs rounded-xl shadow-sm transition"
                      >
                        Return Order
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Product/Seller Review Form Dialog Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-[32px] w-full max-w-xl shadow-2xl border border-gray-100 overflow-hidden animate-scaleUp">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-emerald-900 text-white">
              <h3 className="text-lg font-black">
                Write Review for {reviewModalName}
              </h3>
              <button
                onClick={() => {
                  setIsReviewModalOpen(false);
                  setReviewModalProductId(null);
                  setReviewModalSellerId(null);
                  setReviewModalName("");
                }}
                className="bg-white/10 hover:bg-white/20 text-white p-1.5 rounded-full transition"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 max-h-[75vh] overflow-y-auto">
              <ReviewsTab 
                productId={reviewModalProductId} 
                sellerId={reviewModalSellerId} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
