import React, { useState, useEffect } from "react";
import api, { formatPrice } from "../services/api";
import {
  IndianRupee,
  Calendar,
  Layers,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  FileText
} from "lucide-react";

export default function AdminCommissionAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchAnalytics = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/admin/analytics/commission");
      setAnalytics(response.data?.data || response.data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch commission analytics. Ensure you are authorized.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const totalCommission = analytics?.totalCommission || 0;
  const monthlyData = analytics?.monthlyCommission || {};
  const categoryData = analytics?.categoryCommission || {};

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8 border border-green-150 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <h2 className="text-3xl font-black text-green-950 flex items-center gap-3">
            <TrendingUp className="text-green-600" size={32} />
            Commission Analytics
          </h2>
          <p className="text-gray-500 mt-1">
            Real-time insights on platform fees, monthly growth, and category-level earnings.
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          disabled={loading}
          className="self-start sm:self-center flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 px-4 py-2.5 rounded-xl font-bold transition shadow-sm"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          Refresh Data
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl flex items-center gap-3 font-semibold text-sm">
          <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
          {error}
        </div>
      )}

      {loading && !analytics ? (
        <div className="text-center py-20">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-bold">Compiling platform earnings stats...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Hero KPI Card */}
          <div className="bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 text-white rounded-[32px] p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-12 translate-y-6">
              <IndianRupee size={280} />
            </div>
            
            <div className="space-y-2 relative z-10">
              <span className="bg-white/20 text-white text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full">
                Platform Revenue
              </span>
              <p className="text-sm opacity-90 font-bold pt-2">Total Commission Earned</p>
              <h1 className="text-4xl md:text-5xl font-black">{formatPrice(totalCommission)}</h1>
            </div>

            <div className="relative z-10 bg-white/15 backdrop-blur-md border border-white/10 rounded-2xl p-6 md:max-w-xs w-full text-xs font-bold space-y-3">
              <h4 className="text-sm font-black border-b border-white/20 pb-2">Active Rules Summary</h4>
              <div className="flex justify-between">
                <span>Orders ≤ ₹5,000</span>
                <span>3.5%</span>
              </div>
              <div className="flex justify-between">
                <span>₹5,001 - ₹20,000</span>
                <span>2.5%</span>
              </div>
              <div className="flex justify-between">
                <span>Orders &gt; ₹20,000</span>
                <span>2.0%</span>
              </div>
            </div>
          </div>

          {/* Breakdown Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Monthly Commission Breakdown */}
            <div className="border border-gray-150 rounded-3xl p-6 bg-gray-50/20 space-y-4">
              <h3 className="text-lg font-black text-green-950 flex items-center gap-2 border-b border-gray-100 pb-3">
                <Calendar className="text-green-600" size={20} />
                Monthly Revenue Stream
              </h3>
              
              {Object.keys(monthlyData).length === 0 ? (
                <p className="text-gray-400 font-bold text-center py-12 text-sm">No monthly transaction data available.</p>
              ) : (
                <div className="space-y-3.5">
                  {Object.entries(monthlyData).map(([month, val]) => (
                    <div key={month} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                      <span className="font-extrabold text-gray-700 text-sm">{month}</span>
                      <span className="font-extrabold text-green-700 text-sm">{formatPrice(val)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Category Commission Breakdown */}
            <div className="border border-gray-150 rounded-3xl p-6 bg-gray-50/20 space-y-4">
              <h3 className="text-lg font-black text-green-950 flex items-center gap-2 border-b border-gray-100 pb-3">
                <Layers className="text-green-600" size={20} />
                Commission by Product Category
              </h3>

              {Object.keys(categoryData).length === 0 ? (
                <p className="text-gray-400 font-bold text-center py-12 text-sm">No category-wise commission data available.</p>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded-2xl border border-gray-150 bg-white">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-50 text-gray-500 font-bold border-b border-gray-150">
                          <th className="p-3 pl-4">Category Name</th>
                          <th className="p-3 text-right pr-4">Fees Gathered</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-extrabold text-gray-700">
                        {Object.entries(categoryData).map(([cat, val]) => (
                          <tr key={cat} className="hover:bg-gray-50/50 transition">
                            <td className="p-3 pl-4 flex items-center gap-2">
                              <span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span>
                              {cat}
                            </td>
                            <td className="p-3 text-right pr-4 text-green-700">{formatPrice(val)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
