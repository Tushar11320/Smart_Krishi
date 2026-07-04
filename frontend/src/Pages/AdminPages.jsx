import React, { useState, useEffect } from "react";
import AdminVerificationConsole from "../components/AdminVerificationConsole";
import AdminCommissionAnalytics from "../components/AdminCommissionAnalytics";
import AdminReviewModeration from "../components/AdminReviewModeration";
import api, { formatPrice } from "../services/api";
import { 
  Users, ShieldCheck, Leaf, IndianRupee, BarChart4, FileText, 
  ShieldAlert, Settings, Trash2, CheckCircle, AlertCircle, RefreshCw, 
  MapPin, Eye, Lock, Edit3, Save, Globe
} from "lucide-react";

// Helper layout component for Admin placeholder pages
function AdminPageWrapper({ title, icon: Icon, children }) {
  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn font-outfit">
      <div className="flex items-center gap-3 border-b border-gray-250 pb-4">
        <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl">
          <Icon size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-emerald-950">{title}</h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">Control Panel &bull; Admin Administration Console</p>
        </div>
      </div>
      {children}
    </div>
  );
}

// 1. User Management
export function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      // Endpoint fallback if user list requires pagination
      const res = await api.get("/users");
      const list = res.data?.data?.content || res.data?.content || res.data?.data || [];
      setUsers(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch registered users list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (user, newStatus) => {
    setError("");
    setSuccess("");
    try {
      await api.put(`/users/${user.id}/status`, null, { params: { status: newStatus } });
      setSuccess(`User ${user.email} status updated to ${newStatus}.`);
      fetchUsers();
    } catch (err) {
      console.error(err);
      setError("Failed to update user status.");
    }
  };

  return (
    <AdminPageWrapper title="User Account Management" icon={Users}>
      {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm font-semibold">{error}</div>}
      {success && <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl text-sm font-semibold">{success}</div>}

      <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-extrabold text-emerald-950">Active Users Database</h3>
          <button onClick={fetchUsers} disabled={loading} className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1">
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8"><RefreshCw className="animate-spin text-emerald-600 mx-auto" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-bold text-gray-400 uppercase">
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">Phone</th>
                  <th className="pb-3">Roles</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-50 text-emerald-950 font-semibold">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-6 text-center text-gray-400">No registered users in the database.</td>
                  </tr>
                ) : (
                  users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition">
                      <td className="py-3.5">{u.firstName} {u.lastName}</td>
                      <td className="py-3.5 text-gray-500 font-medium">{u.email}</td>
                      <td className="py-3.5 text-gray-500 font-medium">{u.phone}</td>
                      <td className="py-3.5">
                        <span className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase">
                          {u.roles?.join(", ") || "BUYER"}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <button 
                          onClick={() => handleToggleStatus(u, u.userStatus === "SUSPENDED" ? "ACTIVE" : "SUSPENDED")}
                          className={`text-xs px-3 py-1.5 rounded-lg font-bold border transition ${
                            u.userStatus === "SUSPENDED" 
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100" 
                              : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                          }`}
                        >
                          {u.userStatus === "SUSPENDED" ? "Unblock" : "Block User"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminPageWrapper>
  );
}

// 2. Seller Verification (Embeds Console)
export function AdminSellerVerification() {
  return (
    <AdminPageWrapper title="Seller Profile Onboarding" icon={ShieldCheck}>
      <AdminVerificationConsole />
    </AdminPageWrapper>
  );
}

// 3. Product Moderation
export function AdminProductModeration() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [subTab, setSubTab] = useState("PRODUCTS"); // PRODUCTS or REVIEWS

  const fetchProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/products/admin/all");
      const list = res.data?.data?.content || res.data?.content || res.data?.data || [];
      setProducts(list);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch marketplace products for moderation.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleModerateProduct = async (product, approve) => {
    setError("");
    setSuccess("");
    const newStatus = approve ? "ACTIVE" : "INACTIVE";
    try {
      await api.put(`/products/${product.id}/status`, null, { params: { status: newStatus } });
      setSuccess(`Product "${product.productName}" has been successfully ${approve ? "approved and activated" : "flagged and blocked"}.`);
      fetchProducts();
    } catch (err) {
      console.error(err);
      setError("Failed to moderate product listing.");
    }
  };

  return (
    <AdminPageWrapper title="Product & Reviews Moderation" icon={Leaf}>
      {/* Sub Tab Switcher */}
      <div className="flex gap-2 border-b border-gray-150 pb-4 mb-6">
        <button
          onClick={() => setSubTab("PRODUCTS")}
          className={`px-4 py-2 rounded-xl text-xs font-black transition ${
            subTab === "PRODUCTS"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-100"
              : "bg-white hover:bg-gray-50 text-gray-650 border border-gray-200"
          }`}
        >
          Product Listings
        </button>
        <button
          onClick={() => setSubTab("REVIEWS")}
          className={`px-4 py-2 rounded-xl text-xs font-black transition ${
            subTab === "REVIEWS"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-100"
              : "bg-white hover:bg-gray-50 text-gray-650 border border-gray-200"
          }`}
        >
          Buyer Reviews
        </button>
      </div>

      {subTab === "PRODUCTS" ? (
        <>
          {success && <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl text-sm font-semibold">{success}</div>}

          <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-emerald-950 mb-2">Marketplace Listings Approval</h3>
            
            {loading ? (
              <div className="text-center py-6"><RefreshCw className="animate-spin text-emerald-600 mx-auto" /></div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {products.length === 0 ? (
                  <p className="text-gray-400 text-sm font-bold text-center py-6 col-span-2">No products currently awaiting moderation.</p>
                ) : (
                  products.map(p => (
                    <div key={p.id} className="border border-gray-150 rounded-2xl p-4 flex gap-4 bg-gray-50/50">
                      <img src={p.images?.[0]?.imageUrl || "https://images.unsplash.com/photo-1500937386664-56d1dfef3854"} alt="" className="w-16 h-16 object-cover rounded-xl border border-gray-200" />
                      <div className="flex-grow space-y-1.5">
                        <h4 className="font-extrabold text-sm text-emerald-950">{p.productName}</h4>
                        <p className="text-xs text-gray-550 font-medium">
                          {formatPrice(p.price)} &bull; Qty: {p.inventory?.quantityAvailable || p.quantityAvailable || 0} &bull; 
                          <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            p.productStatus === "ACTIVE" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700 animate-pulse"
                          }`}>
                            {p.productStatus}
                          </span>
                        </p>
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => handleModerateProduct(p, true)}
                            disabled={p.productStatus === "ACTIVE"}
                            className={`font-bold text-[10px] px-3 py-1.5 rounded-lg shadow-sm transition ${
                              p.productStatus === "ACTIVE"
                                ? "bg-gray-150 text-gray-400 cursor-not-allowed"
                                : "bg-emerald-600 hover:bg-emerald-700 text-white"
                            }`}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleModerateProduct(p, false)}
                            disabled={p.productStatus === "INACTIVE"}
                            className={`font-bold text-[10px] px-3 py-1.5 rounded-lg transition ${
                              p.productStatus === "INACTIVE"
                                ? "bg-gray-150 text-gray-400 cursor-not-allowed border border-gray-200"
                                : "bg-red-50 hover:bg-red-100 text-red-650 border border-red-100"
                            }`}
                          >
                            Flag / Block
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        <AdminReviewModeration />
      )}
    </AdminPageWrapper>
  );
}

// 4. Revenue Analytics
export function AdminRevenueAnalytics() {
  return (
    <AdminPageWrapper title="Platform Commission & Revenue Analytics" icon={IndianRupee}>
      <AdminCommissionAnalytics />
    </AdminPageWrapper>
  );
}

// 5. Platform Analytics
export function AdminPlatformAnalytics() {
  return (
    <AdminPageWrapper title="Platform Usage Metrics" icon={BarChart4}>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-sm space-y-1">
          <span className="text-[10px] font-black text-gray-400 uppercase">Daily Active Farmers</span>
          <h2 className="text-3xl font-black text-emerald-950">842 Farmers</h2>
          <span className="text-[10px] font-bold text-emerald-600 block">+15% vs yesterday</span>
        </div>
        <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-sm space-y-1">
          <span className="text-[10px] font-black text-gray-400 uppercase">Platform Transaction Volume</span>
          <h2 className="text-3xl font-black text-emerald-950">₹ 8,45,200</h2>
          <span className="text-[10px] font-bold text-emerald-600 block">+28% weekly trend</span>
        </div>
        <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-sm space-y-1">
          <span className="text-[10px] font-black text-gray-400 uppercase">Active Crop Listings</span>
          <h2 className="text-3xl font-black text-emerald-950">1,402 listings</h2>
          <span className="text-[10px] font-bold text-emerald-600 block">+5% new onboarding</span>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-150 p-6 shadow-sm space-y-4">
        <h3 className="font-extrabold text-emerald-950">Platform Traffic Trend Analysis</h3>
        <svg className="w-full h-48" viewBox="0 0 500 150" preserveAspectRatio="none">
          <path d="M 0 130 Q 120 40 240 100 T 480 30" fill="none" stroke="#059669" strokeWidth="4" />
          <circle cx="120" cy="70" r="6" fill="#ffffff" stroke="#059669" strokeWidth="3" />
          <circle cx="240" cy="100" r="6" fill="#ffffff" stroke="#059669" strokeWidth="3" />
          <circle cx="360" cy="65" r="6" fill="#ffffff" stroke="#059669" strokeWidth="3" />
        </svg>
      </div>
    </AdminPageWrapper>
  );
}

// 6. Order Management
export function AdminOrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAllOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get("/orders");
      const list = res.data?.data?.content || res.data?.content || res.data?.data || [];
      setOrders(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllOrders();
  }, []);

  return (
    <AdminPageWrapper title="System-Wide Order Registry" icon={FileText}>
      <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-extrabold text-emerald-950">All Orders Log</h3>
          <button onClick={fetchAllOrders} className="text-xs font-bold text-emerald-700 hover:underline">
            Reload Registry
          </button>
        </div>

        {loading ? (
          <div className="text-center py-6"><RefreshCw className="animate-spin text-emerald-600 mx-auto" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-bold text-gray-400 uppercase">
                  <th className="pb-3">Order Number</th>
                  <th className="pb-3">Buyer Address</th>
                  <th className="pb-3">Total Cost</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-50 text-emerald-950 font-semibold">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-6 text-center text-gray-400">No orders registered in sandbox currently.</td>
                  </tr>
                ) : (
                  orders.map(o => (
                    <tr key={o.id}>
                      <td className="py-3">{o.orderNumber}</td>
                      <td className="py-3 text-gray-500 font-medium">{o.shippingAddress}</td>
                      <td className="py-3 text-emerald-700 font-extrabold">{formatPrice(o.totalAmount)}</td>
                      <td className="py-3">
                        <span className={`inline-block text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                          o.orderStatus === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                          o.orderStatus === "ACCEPTED" ? "bg-indigo-100 text-indigo-800" :
                          o.orderStatus === "PACKED" ? "bg-orange-100 text-orange-800" :
                          o.orderStatus === "SHIPPED" ? "bg-purple-100 text-purple-800" :
                          o.orderStatus === "OUT_FOR_DELIVERY" ? "bg-pink-100 text-pink-850" :
                          o.orderStatus === "DELIVERED" ? "bg-green-100 text-green-800" :
                          o.orderStatus === "CANCELLED" ? "bg-red-100 text-red-800" :
                          o.orderStatus === "RETURNED" ? "bg-amber-100 text-amber-800" :
                          o.orderStatus === "REFUNDED" ? "bg-teal-100 text-teal-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {o.orderStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminPageWrapper>
  );
}// 7. Fraud Monitoring
export function AdminFraudMonitoring() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAlerts = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/analytics/fraud/alerts");
      setAlerts(res.data?.data || res.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch platform security logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleLockAccount = async (userId, userEmail) => {
    if (!window.confirm(`Are you sure you want to SUSPEND user ${userEmail}?`)) return;
    setActionLoading(true);
    setError("");
    setSuccess("");
    try {
      await api.put(`/users/${userId}/status`, null, { params: { status: "SUSPENDED" } });
      setSuccess(`User account ${userEmail} was suspended.`);
      fetchAlerts();
    } catch (err) {
      console.error(err);
      setError("Failed to suspend account.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminPageWrapper title="Fraud Monitoring Center" icon={ShieldAlert}>
      {error && <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-sm font-semibold mb-4">{error}</div>}
      {success && <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 p-4 rounded-xl text-sm font-semibold mb-4">{success}</div>}

      <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
          <h3 className="font-extrabold text-emerald-950">Active Security Warnings</h3>
          <button onClick={fetchAlerts} disabled={loading} className="text-xs font-bold text-emerald-700 flex items-center gap-1 hover:underline">
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        {loading && alerts.length === 0 ? (
          <div className="text-center py-8"><RefreshCw className="animate-spin text-emerald-600 mx-auto" /></div>
        ) : (
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <p className="text-center py-8 text-gray-400 font-bold text-sm">No security warnings flagged currently.</p>
            ) : (
              alerts.map(a => (
                <div key={a.id} className="p-4 bg-gray-50/50 rounded-2xl border border-gray-150 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                        a.severity === "CRITICAL" ? "bg-red-600 text-white" :
                        a.severity === "HIGH" ? "bg-red-100 text-red-800" :
                        "bg-amber-100 text-amber-800"
                      }`}>{a.severity}</span>
                      <h4 className="font-extrabold text-sm text-emerald-950">{a.type}</h4>
                    </div>
                    <p className="text-xs text-gray-550 font-semibold">{a.detail}</p>
                    <p className="text-[10px] text-gray-400 font-bold">User account: {a.affectedUserEmail || "N/A"}</p>
                  </div>
                  {a.affectedUserId && (
                    <button
                      onClick={() => handleLockAccount(a.affectedUserId, a.affectedUserEmail)}
                      disabled={actionLoading}
                      className="text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50 disabled:bg-gray-150 disabled:text-gray-400 px-3.5 py-1.5 rounded-xl transition"
                    >
                      Lock Account
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </AdminPageWrapper>
  );
}

// 8. System Settings
export function AdminSystemSettings() {
  const [feePercent, setFeePercent] = useState(3.5);
  const [flatShipping, setFlatShipping] = useState(350);
  const [systemOnline, setSystemOnline] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <AdminPageWrapper title="System Parameter Settings" icon={Settings}>
      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-gray-150 p-6 shadow-sm space-y-6">
        <h3 className="font-extrabold text-emerald-950 border-b border-gray-100 pb-3">Financial Variables</h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-400 mb-1">Standard Platform Fee Percentage (%)</label>
            <input 
              type="number" 
              step="0.1"
              value={feePercent}
              onChange={(e) => setFeePercent(parseFloat(e.target.value))}
              className="border border-gray-350 p-3 rounded-xl text-sm font-semibold"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-400 mb-1">Flat Delivery Shipping Charge (₹)</label>
            <input 
              type="number" 
              value={flatShipping}
              onChange={(e) => setFlatShipping(parseInt(e.target.value))}
              className="border border-gray-350 p-3 rounded-xl text-sm font-semibold"
            />
          </div>
        </div>

        <h3 className="font-extrabold text-emerald-950 border-b border-gray-100 pb-3 pt-3">Platform Governance</h3>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-emerald-950 text-sm">System Storefront Access</h4>
            <p className="text-xs text-gray-400 font-bold">Lock storefront registration parameters during high peak loads</p>
          </div>
          <input 
            type="checkbox" 
            checked={systemOnline}
            onChange={(e) => setSystemOnline(e.target.checked)}
            className="w-10 h-6 bg-gray-200 rounded-full appearance-none checked:bg-emerald-600 transition cursor-pointer"
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
          {saved && <span className="text-emerald-700 text-xs font-bold self-center">Settings updated successfully!</span>}
          <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-3 rounded-xl shadow-md transition">
            Save System Configurations
          </button>
        </div>
      </form>
    </AdminPageWrapper>
  );
}

// 9. Feedback & Complaint Management
import { MessageSquare, Calendar, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2, BadgeAlert } from "lucide-react";

export function AdminFeedbackManagement() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);

  const fetchFeedbacks = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/feedback", {
        params: {
          category: categoryFilter || undefined,
          status: statusFilter || undefined,
          page,
          size: 10
        }
      });
      const data = res.data?.data;
      setFeedbacks(data?.content || []);
      setTotalPages(data?.totalPages || 0);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch user feedback records.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const res = await api.get("/feedback/metrics");
      setMetrics(res.data?.data || null);
    } catch (err) {
      console.error("Failed to fetch feedback metrics", err);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
    fetchMetrics();
  }, [categoryFilter, statusFilter, page]);

  const handleUpdateStatus = async (id, newStatus) => {
    setActionLoading(true);
    setError("");
    setSuccess("");
    try {
      await api.put(`/feedback/${id}/status`, null, { params: { status: newStatus } });
      setSuccess(`Feedback ticket resolved with status: ${newStatus}`);
      fetchFeedbacks();
      fetchMetrics();
    } catch (err) {
      console.error(err);
      setError("Failed to update ticket status.");
    } finally {
      setActionLoading(false);
    }
  };

  const getPriorityBadgeColor = (p) => {
    switch (p) {
      case "CRITICAL": return "bg-red-105 text-red-800 border-red-200";
      case "HIGH": return "bg-orange-100 text-orange-850 border-orange-200";
      case "MEDIUM": return "bg-blue-105 text-blue-800 border-blue-200";
      default: return "bg-gray-105 text-gray-800 border-gray-200";
    }
  };

  const getStatusBadgeColor = (s) => {
    switch (s) {
      case "RESOLVED": return "bg-emerald-105 text-emerald-800 border-emerald-200";
      case "INVESTIGATING": return "bg-amber-105 text-amber-800 border-amber-200";
      case "DISMISSED": return "bg-gray-200 text-gray-700 border-gray-300";
      default: return "bg-red-50 text-red-600 border-red-105 animate-pulse";
    }
  };

  return (
    <AdminPageWrapper title="Admin Feedback Module" icon={MessageSquare}>
      {error && <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl text-sm font-semibold">{error}</div>}
      {success && <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 p-4 rounded-2xl text-sm font-semibold">{success}</div>}

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-gray-150 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-black text-gray-400 uppercase tracking-wider">Total Tickets</span>
            <span className="text-3xl font-black text-emerald-950 mt-2">{metrics.totalCount || 0}</span>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-gray-150 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-black text-gray-400 uppercase tracking-wider">Pending Issues</span>
            <span className="text-3xl font-black text-red-650 mt-2">
              {metrics.byStatus?.PENDING || 0}
            </span>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-gray-150 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-black text-gray-400 uppercase tracking-wider">Active Complaints</span>
            <span className="text-3xl font-black text-orange-650 mt-2">
              {metrics.byCategory?.COMPLAINT || 0}
            </span>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-gray-150 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-black text-gray-400 uppercase tracking-wider">Bugs Reported</span>
            <span className="text-3xl font-black text-blue-650 mt-2">
              {metrics.byCategory?.BUG_REPORT || 0}
            </span>
          </div>
        </div>
      )}

      {/* Filters and List */}
      <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <h3 className="font-extrabold text-emerald-950">Feedback Inbox</h3>
          <div className="flex flex-wrap items-center gap-3">
            <select 
              value={categoryFilter}
              onChange={e => { setCategoryFilter(e.target.value); setPage(0); }}
              className="border border-gray-300 p-2.5 rounded-xl text-xs bg-white font-bold text-gray-700"
            >
              <option value="">All Categories</option>
              <option value="BUG_REPORT">Bugs</option>
              <option value="SUGGESTION">Suggestions</option>
              <option value="COMPLAINT">Complaints</option>
              <option value="FEATURE_REQUEST">Features</option>
            </select>

            <select 
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
              className="border border-gray-300 p-2.5 rounded-xl text-xs bg-white font-bold text-gray-700"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="INVESTIGATING">Investigating</option>
              <option value="RESOLVED">Resolved</option>
              <option value="DISMISSED">Dismissed</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12"><RefreshCw className="animate-spin text-emerald-600 mx-auto" /></div>
        ) : feedbacks.length === 0 ? (
          <p className="text-center py-12 text-gray-400 font-bold text-sm">No feedback tickets match the current filters.</p>
        ) : (
          <div className="space-y-4">
            {feedbacks.map(f => (
              <div key={f.id} className="p-5 border border-gray-150 rounded-3xl bg-gray-50/50 hover:bg-gray-50 transition flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-emerald-50 text-emerald-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-emerald-200">
                      {f.category.replace("_", " ")}
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${getPriorityBadgeColor(f.priority)}`}>
                      {f.priority}
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${getStatusBadgeColor(f.status)}`}>
                      {f.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-base text-emerald-950">{f.subject}</h4>
                    <p className="text-xs text-gray-500 font-semibold mt-1 leading-relaxed whitespace-pre-wrap">{f.description}</p>
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-gray-400 font-bold">
                    <span>Submitted by: <strong className="text-emerald-950">{f.userName}</strong> ({f.userEmail})</span>
                    <span>&bull;</span>
                    <span>{new Date(f.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex md:flex-col items-end gap-3 justify-between md:justify-start">
                  {f.screenshotUrl ? (
                    <div 
                      onClick={() => setSelectedScreenshot(f.screenshotUrl)}
                      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-gray-255 w-24 h-16 bg-gray-100 flex items-center justify-center"
                    >
                      <img src={f.screenshotUrl} alt="Screenshot" className="w-full h-full object-cover group-hover:scale-105 transition" />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                        <Eye size={16} />
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-gray-400 font-bold italic py-2">No Screenshot</div>
                  )}

                  {f.status !== "RESOLVED" && f.status !== "DISMISSED" && (
                    <div className="flex gap-2">
                      {f.status === "PENDING" && (
                        <button 
                          disabled={actionLoading}
                          onClick={() => handleUpdateStatus(f.id, "INVESTIGATING")}
                          className="bg-amber-50 hover:bg-amber-100 text-amber-700 font-extrabold text-[11px] px-3.5 py-2 rounded-xl border border-amber-200 transition"
                        >
                          Investigate
                        </button>
                      )}
                      <button 
                        disabled={actionLoading}
                        onClick={() => handleUpdateStatus(f.id, "RESOLVED")}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] px-3.5 py-2 rounded-xl shadow transition cursor-pointer"
                      >
                        Resolve
                      </button>
                      <button 
                        disabled={actionLoading}
                        onClick={() => handleUpdateStatus(f.id, "DISMISSED")}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[11px] px-3.5 py-2 rounded-xl transition cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 border-t border-gray-100 pt-4">
            <button 
              disabled={page === 0} 
              onClick={() => setPage(page - 1)}
              className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold text-gray-500">Page {page + 1} of {totalPages}</span>
            <button 
              disabled={page === totalPages - 1} 
              onClick={() => setPage(page + 1)}
              className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Screenshot Modal */}
      {selectedScreenshot && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedScreenshot(null)}
        >
          <div className="relative max-w-3xl w-full bg-white rounded-3xl overflow-hidden p-2 shadow-2xl">
            <img src={selectedScreenshot} alt="Full Screenshot" className="w-full h-auto rounded-2xl object-contain max-h-[80vh]" />
          </div>
        </div>
      )}
    </AdminPageWrapper>
  );
}
