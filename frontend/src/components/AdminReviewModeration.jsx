import React, { useState, useEffect } from "react";
import api, { formatPrice } from "../services/api";
import { CheckCircle, AlertCircle, RefreshCw, Trash2, ShieldCheck, ShieldAlert, Star, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminReviewModeration() {
  const [pendingReviews, setPendingReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchPendingReviews = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/reviews/pending");
      const content = res.data?.data?.content || res.data?.data || res.data?.content || [];
      setPendingReviews(Array.isArray(content) ? content : []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch reviews pending moderation.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingReviews();
  }, []);

  const handleModerateReview = async (id, approve) => {
    try {
      await api.put(`/reviews/${id}/moderation`, null, {
        params: { approve: approve }
      });
      toast.success(approve ? "Review approved and published! 🌾" : "Review flagged and removed.");
      fetchPendingReviews();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Action failed.");
    }
  };

  const handleDeleteReview = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this review?")) return;
    try {
      await api.delete(`/reviews/${id}`);
      toast.success("Review permanently deleted.");
      fetchPendingReviews();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Permanent delete action failed.");
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl flex items-center gap-3 font-semibold">
          <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-extrabold text-emerald-950 flex items-center gap-2">
            <MessageSquare size={18} className="text-emerald-600" />
            Buyer Reviews Awaiting Approval
          </h3>
          <button 
            onClick={fetchPendingReviews} 
            disabled={loading} 
            className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1.5"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh List
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-gray-400 font-semibold">Syncing review log database...</p>
          </div>
        ) : pendingReviews.length === 0 ? (
          <div className="text-center py-12 text-gray-400 font-semibold text-sm">
            No pending reviews currently. All reviews are up to date! 🌾
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {pendingReviews.map((rev) => (
              <div 
                key={rev.id} 
                className="border border-gray-150 rounded-3xl p-5 bg-gray-50/40 hover:border-emerald-300 transition-all duration-300 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Target and Rating */}
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-[9px] font-black uppercase text-gray-450 tracking-wider">Review Target</span>
                      <h4 className="font-extrabold text-sm text-emerald-950">
                        {rev.productName ? `Product: ${rev.productName}` : `Seller ID: ${rev.sellerId}`}
                      </h4>
                    </div>
                    <span className="flex items-center gap-0.5 bg-yellow-50 text-yellow-800 text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0">
                      <Star size={10} className="fill-yellow-500 text-yellow-500" />
                      {rev.rating}
                    </span>
                  </div>

                  {/* Buyer details */}
                  <div className="text-[10px] text-gray-450 font-bold">
                    By Buyer ID: <strong className="text-gray-700">#{rev.buyerId}</strong> &bull; Written on {new Date(rev.createdAt).toLocaleDateString()}
                  </div>

                  {/* Review Text */}
                  <div className="space-y-1">
                    <h5 className="font-extrabold text-xs text-gray-800">{rev.reviewTitle}</h5>
                    <p className="text-xs text-gray-650 leading-relaxed font-medium">{rev.reviewText}</p>
                  </div>

                  {/* Image Attachment preview */}
                  {rev.reviewImage && (
                    <div className="w-20 h-20 rounded-xl overflow-hidden border border-gray-200 mt-2">
                      <img src={rev.reviewImage} alt="Attachment" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                {/* Moderation Controls */}
                <div className="pt-3 border-t border-gray-150 flex items-center justify-between">
                  <button 
                    onClick={() => handleDeleteReview(rev.id)}
                    className="p-2 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition"
                    title="Permanently Delete Review"
                  >
                    <Trash2 size={15} />
                  </button>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleModerateReview(rev.id, false)}
                      className="px-3 py-1.5 border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 font-extrabold text-[10px] rounded-lg transition"
                    >
                      Reject
                    </button>
                    <button 
                      onClick={() => handleModerateReview(rev.id, true)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] rounded-lg shadow-sm transition"
                    >
                      Approve & Publish
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
