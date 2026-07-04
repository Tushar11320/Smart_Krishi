import React, { useState, useEffect } from "react";
import api, { formatPrice } from "../../services/api";
import { Heart, Trash2, ShoppingCart, AlertCircle } from "lucide-react";

export default function Wishlist() {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      fetchWishlist(parsed.id);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchWishlist = async (userId) => {
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await api.get(`/wishlist/${userId}`);
      const content = response.data?.content || response.data?.data?.content || response.data?.data || [];
      setItems(content);
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to fetch wishlist items.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId) => {
    if (!user) return;
    setErrorMessage("");
    setSuccessMessage("");
    try {
      await api.delete(`/wishlist/${user.id}/products/${productId}`);
      setItems(prev => prev.filter(item => item.productId !== productId));
      setSuccessMessage("Item removed from wishlist.");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to remove item.");
    }
  };

  const handleAddToCart = async (product) => {
    if (!user) return;
    setErrorMessage("");
    setSuccessMessage("");
    try {
      await api.post(`/cart/${user.id}/items`, {
        productId: product.productId,
        quantity: 1
      });
      setSuccessMessage(`${product.productName || "Product"} added to cart! 🛒`);
      setTimeout(() => setSuccessMessage(""), 3000);
      window.dispatchEvent(new Event("storage")); // update cart counts in Topbar/Navbar
    } catch (err) {
      console.error(err);
      setErrorMessage(err.response?.data?.message || "Failed to add to cart.");
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-gray-150 shadow">
        <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500 font-medium">Loading your wishlist...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-8 border border-green-100 shadow-lg space-y-6 animate-fadeIn">
      <div>
        <h3 className="text-2xl font-black text-green-950 flex items-center gap-2">
          <Heart className="text-red-500 fill-red-500" size={24} />
          My Wishlist
        </h3>
        <p className="text-xs text-gray-400 font-bold mt-1">Products you are interested in buying later.</p>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl flex items-center gap-3 font-medium text-sm">
          <Heart className="text-green-600" size={20} />
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-center gap-3 font-medium text-sm">
          <AlertCircle className="text-red-600" size={20} />
          {errorMessage}
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <Heart size={48} className="mx-auto text-gray-300 mb-4" />
          <h4 className="text-lg font-bold text-gray-700">Your wishlist is empty</h4>
          <p className="text-sm text-gray-400 mt-1">Explore our marketplace to save items for later purchase.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {items.map((item) => (
            <div key={item.id} className="border border-gray-150 rounded-3xl p-4 bg-gray-50/30 hover:border-green-200 transition duration-300 flex gap-4 items-center">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl overflow-hidden shrink-0 border border-gray-100">
                {item.productImage ? (
                  <img src={item.productImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold">Smart</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-extrabold text-sm text-green-950 truncate">{item.productName}</h4>
                <div className="text-sm font-extrabold text-green-700 mt-1">{formatPrice(item.price)}</div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleAddToCart(item)}
                    className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold px-3 py-1.5 shadow transition cursor-pointer"
                  >
                    <ShoppingCart size={12} /> Add to Cart
                  </button>
                  <button
                    onClick={() => handleRemove(item.productId)}
                    className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl border border-red-150 transition cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
