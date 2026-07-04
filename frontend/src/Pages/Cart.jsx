import React, { useState, useEffect } from "react";
import { ShoppingCart, Trash2, ArrowRight, ShieldCheck, CheckCircle, AlertCircle, Bookmark, RefreshCw, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api, { formatPrice } from "../services/api";

export default function Cart() {
  const navigate = useNavigate();
  
  const [activeItems, setActiveItems] = useState([]);
  const [savedItems, setSavedItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // stores cartItemId for inline loaders
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const getLoggedInUser = () => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  };

  const user = getLoggedInUser();
  const userId = user?.id;

  const fetchCart = async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const res = await api.get(`/cart/${userId}`);
      const cartData = res.data?.data || res.data;
      const items = cartData.cartItems || [];
      
      // Load details (image, category) for each product
      const itemsWithDetails = await Promise.all(items.map(async (item) => {
        try {
          const prodRes = await api.get(`/products/${item.productId}`);
          const prodData = prodRes.data?.data || prodRes.data;
          const imgUrl = prodData.images?.[0]?.imageUrl || "https://images.unsplash.com/photo-1500937386664-56d1dfef3854";
          const categoryName = prodData.categoryName || "General";
          return { ...item, image: imgUrl, category: categoryName };
        } catch (err) {
          console.error("Failed to load details for product", item.productId, err);
          return { ...item, image: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854", category: "General" };
        }
      }));

      // Split active items from saved-for-later items
      const active = itemsWithDetails.filter(item => !item.saveForLater);
      const saved = itemsWithDetails.filter(item => item.saveForLater);

      setActiveItems(active);
      setSavedItems(saved);
      setCartTotal(cartData.totalPrice || 0);
      setTotalItems(cartData.totalItems || 0);
    } catch (err) {
      console.error("Failed to fetch cart:", err);
      setError("Unable to retrieve your shopping cart.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) {
      setError("Please log in to manage your shopping cart.");
      setTimeout(() => navigate("/account"), 1800);
      return;
    }
    fetchCart();
  }, [userId]);

  const updateQuantity = async (cartItemId, currentQty, delta) => {
    const newQty = currentQty + delta;
    if (newQty < 1) return;
    setError("");
    setActionLoading(cartItemId);
    try {
      await api.put(`/cart/${userId}/items/${cartItemId}?quantity=${newQty}`);
      await fetchCart();
    } catch (err) {
      console.error(err);
      setError("Failed to update item quantity.");
    } finally {
      setActionLoading(null);
    }
  };

  const removeItem = async (cartItemId) => {
    if (!window.confirm("Remove this item from your cart?")) return;
    setError("");
    setSuccess("");
    setActionLoading(cartItemId);
    try {
      await api.delete(`/cart/${userId}/items/${cartItemId}`);
      setSuccess("Item removed successfully.");
      await fetchCart();
    } catch (err) {
      console.error(err);
      setError("Failed to remove item.");
    } finally {
      setActionLoading(null);
    }
  };

  const toggleSaveForLater = async (cartItemId, shouldSave) => {
    setError("");
    setSuccess("");
    setActionLoading(cartItemId);
    try {
      await api.put(`/cart/${userId}/items/${cartItemId}/save-for-later?save=${shouldSave}`);
      setSuccess(shouldSave ? "Item saved for later." : "Item moved back to cart.");
      await fetchCart();
    } catch (err) {
      console.error(err);
      setError("Failed to update item status.");
    } finally {
      setActionLoading(null);
    }
  };

  const clearCart = async () => {
    if (!window.confirm("Clear all active items from your cart?")) return;
    setError("");
    setSuccess("");
    setIsLoading(true);
    try {
      await api.delete(`/cart/${userId}`);
      setSuccess("Active cart cleared successfully.");
      await fetchCart();
    } catch (err) {
      console.error(err);
      setError("Failed to clear active cart.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-emerald-950 font-bold font-outfit">Loading your shopping cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] p-4 md:p-8 font-outfit">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Area */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200/60 pb-6">
          <div>
            <h1 className="text-4xl font-extrabold text-emerald-950 flex items-center gap-3">
              <ShoppingCart size={36} className="text-emerald-600 animate-pulse-slow" />
              My Shopping Cart
            </h1>
            <p className="text-gray-500 text-sm mt-1">Manage your active yields and items saved for later purchases.</p>
          </div>
          {activeItems.length > 0 && (
            <button
              onClick={clearCart}
              className="text-red-600 hover:text-red-700 font-extrabold text-sm border border-red-200 hover:bg-red-50 px-4 py-2 rounded-xl transition duration-200"
            >
              Clear Active Cart
            </button>
          )}
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

        {/* Main Content Split */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Items Section */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Active Items */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-emerald-950 flex items-center gap-2">
                Active Items ({activeItems.length})
              </h2>
              
              {activeItems.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 text-center border border-emerald-100/40 shadow-sm space-y-4">
                  <ShoppingCart size={48} className="mx-auto text-gray-300" />
                  <p className="text-gray-500 font-medium">Your active shopping cart is empty.</p>
                  <button
                    onClick={() => navigate("/")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-3 rounded-xl transition shadow-md shadow-emerald-100 text-sm"
                  >
                    Browse Marketplace
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-3xl border border-gray-150 p-5 flex flex-col sm:flex-row items-center gap-5 hover:shadow-md transition-all duration-300 relative"
                    >
                      {actionLoading === item.id && (
                        <div className="absolute inset-0 bg-white/60 rounded-3xl flex items-center justify-center z-10">
                          <RefreshCw className="animate-spin text-emerald-600" size={24} />
                        </div>
                      )}
                      
                      <img
                        src={item.image}
                        alt={item.productName}
                        className="w-20 h-20 object-cover rounded-2xl border border-gray-100 shadow-inner flex-shrink-0"
                      />
                      
                      <div className="flex-grow text-center sm:text-left space-y-1">
                        <span className="bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                          {item.category}
                        </span>
                        <h3 className="font-bold text-emerald-950 text-base">{item.productName}</h3>
                        <p className="text-emerald-700 font-extrabold text-sm">{formatPrice(item.unitPrice)}</p>
                      </div>

                      {/* Controls and actions */}
                      <div className="flex flex-wrap items-center justify-center gap-4">
                        {/* Quantity controls */}
                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-150 px-2 py-1 rounded-xl">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity, -1)}
                            className="w-7 h-7 rounded-lg bg-white border border-gray-100 shadow-sm flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100 transition"
                          >
                            -
                          </button>
                          <span className="font-extrabold text-emerald-950 w-6 text-center text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity, 1)}
                            className="w-7 h-7 rounded-lg bg-white border border-gray-100 shadow-sm flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100 transition"
                          >
                            +
                          </button>
                        </div>

                        {/* Save for later button */}
                        <button
                          onClick={() => toggleSaveForLater(item.id, true)}
                          className="text-gray-400 hover:text-emerald-600 p-2 hover:bg-emerald-50 rounded-xl transition duration-200"
                          title="Save for Later"
                        >
                          <Bookmark size={18} />
                        </button>

                        {/* Delete button */}
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-xl transition duration-200"
                          title="Remove item"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Saved For Later Items */}
            <div className="space-y-4 pt-4">
              <h2 className="text-xl font-bold text-emerald-950 flex items-center gap-2">
                Saved For Later ({savedItems.length})
              </h2>
              
              {savedItems.length === 0 ? (
                <p className="text-gray-400 font-medium pl-2 text-sm">No items saved for later yet.</p>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {savedItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-3xl border border-gray-150 p-4 flex gap-4 hover:shadow-sm transition-all duration-300 relative"
                    >
                      {actionLoading === item.id && (
                        <div className="absolute inset-0 bg-white/60 rounded-3xl flex items-center justify-center z-10">
                          <RefreshCw className="animate-spin text-emerald-600" size={20} />
                        </div>
                      )}

                      <img
                        src={item.image}
                        alt={item.productName}
                        className="w-16 h-16 object-cover rounded-xl border border-gray-100 shadow-inner flex-shrink-0"
                      />
                      
                      <div className="flex-grow flex flex-col justify-between space-y-2">
                        <div>
                          <h4 className="font-bold text-emerald-950 text-sm line-clamp-1">{item.productName}</h4>
                          <p className="text-emerald-700 font-extrabold text-xs">{formatPrice(item.unitPrice)}</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleSaveForLater(item.id, false)}
                            className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-lg text-xs font-bold transition duration-200"
                          >
                            Move to Cart
                          </button>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition duration-200"
                            title="Remove item"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Cart Summary Panel */}
          <div className="bg-white rounded-[32px] shadow-sm border border-gray-150 p-6 h-fit space-y-6">
            <h2 className="text-2xl font-extrabold text-emerald-950 border-b border-gray-200/60 pb-4">Cart Summary</h2>

            <div className="space-y-4">
              <div className="flex justify-between text-sm text-gray-500 font-bold">
                <span>Total Items</span>
                <span className="font-extrabold text-emerald-950">{totalItems} items</span>
              </div>
              <div className="flex justify-between text-base text-gray-700 font-bold">
                <span>Subtotal</span>
                <span className="font-extrabold text-emerald-950 text-lg">{formatPrice(cartTotal)}</span>
              </div>
            </div>

            <div className="flex items-start gap-3 text-emerald-800 bg-emerald-50 p-4 rounded-2xl text-xs font-semibold leading-relaxed">
              <ShieldCheck size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <span>Secure pricing active. Platform fee, delivery rates, and taxes are computed safely on checkout preview.</span>
              </div>
            </div>

            {activeItems.length > 0 ? (
              <button
                onClick={() => navigate("/checkout")}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-4 rounded-2xl shadow-lg shadow-emerald-100/50 flex items-center justify-center gap-2 group transition duration-300"
              >
                Proceed to Checkout
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <button
                disabled
                className="w-full bg-gray-200 text-gray-400 font-extrabold py-4 rounded-2xl cursor-not-allowed flex items-center justify-center gap-2"
              >
                Cart is Empty
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
