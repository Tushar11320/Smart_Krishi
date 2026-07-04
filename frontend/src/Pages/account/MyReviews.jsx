import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { MessageCircle, Trash2, Star, Edit, X, CheckCircle, AlertCircle } from "lucide-react";

export default function MyReviews() {
  const [user, setUser] = useState(null);
  const [userReviews, setUserReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Edit Review Modal state
  const [editingReview, setEditingReview] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editTitle, setEditTitle] = useState("");
  const [editText, setEditText] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      fetchUserReviews(parsed.id);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserReviews = async (userId) => {
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await api.get(`/reviews/user/${userId}`);
      const content = response.data?.content || response.data?.data?.content || response.data?.data || [];
      setUserReviews(Array.isArray(content) ? content : []);
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to fetch your reviews.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review? 🌾")) return;
    setErrorMessage("");
    setSuccessMessage("");
    try {
      await api.delete(`/reviews/${reviewId}`);
      setUserReviews(prev => prev.filter(r => r.id !== reviewId));
      setSuccessMessage("Review deleted successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.response?.data?.message || "Failed to delete review.");
    }
  };

  const handleOpenEdit = (review) => {
    setEditingReview(review);
    setEditRating(review.rating);
    setEditTitle(review.reviewTitle || "");
    setEditText(review.reviewText || "");
  };

  const handleCloseEdit = () => {
    setEditingReview(null);
    setEditTitle("");
    setEditText("");
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setEditSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const payload = {
        buyerId: user.id,
        productId: editingReview.productId,
        sellerId: editingReview.sellerId,
        rating: editRating,
        reviewTitle: editTitle,
        reviewText: editText,
        reviewImage: editingReview.reviewImage
      };

      const response = await api.put(`/reviews/${editingReview.id}`, payload);
      const updatedReview = response.data?.data || response.data;
      
      setUserReviews(prev => prev.map(r => r.id === editingReview.id ? { ...r, ...updatedReview } : r));
      setSuccessMessage("Review updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
      handleCloseEdit();
    } catch (err) {
      console.error(err);
      setErrorMessage(err.response?.data?.message || "Failed to update review.");
    } finally {
      setEditSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-gray-150 shadow">
        <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500 font-medium">Loading your reviews...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-8 border border-green-100 shadow-lg space-y-6 animate-fadeIn">
      <div>
        <h3 className="text-2xl font-black text-green-950 flex items-center gap-2">
          <MessageCircle className="text-green-600" size={24} />
          My Product & Seller Reviews
        </h3>
        <p className="text-xs text-gray-400 font-bold mt-1">Manage reviews you've written for products and sellers.</p>
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

      {userReviews.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <MessageCircle size={48} className="mx-auto text-gray-300 mb-4" />
          <h4 className="text-lg font-bold text-gray-700">No reviews written yet</h4>
          <p className="text-sm text-gray-400 mt-1">Your reviews help other farmers make better decisions. You can write reviews for items in your Orders History.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {userReviews.map((rev) => (
            <div key={rev.id} className="border border-gray-150 rounded-3xl p-6 bg-gray-50/30 hover:border-green-200 transition-all duration-300 space-y-4">
              <div className="flex justify-between items-start flex-wrap gap-2 border-b border-gray-100 pb-3">
                <div>
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Review Target</span>
                  <h4 className="font-extrabold text-green-950 text-base">
                    {rev.productName ? `Product: ${rev.productName}` : `Seller: ${rev.sellerBusinessName || rev.sellerName || "Local Merchant"}`}
                  </h4>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenEdit(rev)}
                    className="text-emerald-600 hover:text-emerald-700 p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition shadow-sm"
                    title="Edit Review"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteReview(rev.id)}
                    className="text-red-500 hover:text-red-700 p-2 rounded-xl bg-red-50 hover:bg-red-100 transition shadow-sm"
                    title="Delete Review"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={14}
                      className={s <= rev.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-200"}
                    />
                  ))}
                  <span className="text-[10px] text-gray-400 font-bold ml-2">
                    {new Date(rev.createdAt).toLocaleDateString()}
                  </span>
                  <span className={`ml-auto text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                    rev.approved ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {rev.approved ? "Approved" : "Pending Moderation"}
                  </span>
                </div>

                <div className="space-y-1">
                  <h5 className="font-extrabold text-sm text-gray-900">{rev.reviewTitle}</h5>
                  <p className="text-xs text-gray-650 font-medium leading-relaxed">{rev.reviewText}</p>
                </div>

                {rev.reviewImage && (
                  <div className="w-20 h-20 rounded-xl overflow-hidden border border-gray-200 mt-2">
                    <img src={rev.reviewImage} alt="" className="w-full h-full object-cover" />
                  </div>
                )}

                {rev.sellerResponse && (
                  <div className="bg-emerald-50/40 border-l-2 border-emerald-500 rounded-r-xl p-3 mt-2 text-xs">
                    <div className="font-extrabold text-emerald-800">Seller Response:</div>
                    <p className="text-gray-650 mt-1 font-medium">{rev.sellerResponse}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Review Modal Dialog */}
      {editingReview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-[32px] w-full max-w-xl shadow-2xl border border-gray-100 overflow-hidden animate-scaleUp">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-emerald-900 text-white">
              <h3 className="text-lg font-black">
                Edit Review
              </h3>
              <button
                onClick={handleCloseEdit}
                className="bg-white/10 hover:bg-white/20 text-white p-1.5 rounded-full transition"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-left">
              {/* Rating selection */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Select Star Rating</label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setEditRating(s)}
                      className="p-0.5 transition hover:scale-110 cursor-pointer bg-transparent border-0 outline-none"
                    >
                      <Star
                        size={28}
                        className={s <= editRating ? "text-yellow-500 fill-yellow-500" : "text-gray-200"}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Title input */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Review Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-xs font-semibold"
                  required
                />
              </div>

              {/* Text input */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Review Content</label>
                <textarea
                  rows={4}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-xs font-semibold"
                  required
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  className="px-4 py-2 border border-gray-255 hover:bg-gray-50 text-gray-600 font-bold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                  {editSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
