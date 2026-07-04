import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api, { formatPrice } from "../services/api";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Leaf,
  IndianRupee,
  FileText,
  ShieldAlert,
  Settings,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Eye,
  Lock,
  ArrowRight,
  TrendingUp
} from "lucide-react";

export default function AdminDashboardOverview() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/admin/analytics/dashboard");
      setStats(response.data?.data || response.data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch administrator dashboard stats.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleBlockUser = async (userId, userEmail) => {
    if (!window.confirm(`Are you sure you want to BLOCK user ${userEmail}?`)) return;
    setActionLoading(true);
    setError("");
    setSuccess("");
    try {
      await api.put(`/users/${userId}/status`, null, { params: { status: "SUSPENDED" } });
      setSuccess(`User ${userEmail} has been successfully suspended.`);
      fetchStats();
    } catch (err) {
      console.error(err);
      setError("Failed to suspend user account.");
    } finally {
      setActionLoading(false);
    }
  };

  // SVG Chart rendering helper
  const drawLineChart = (dataMap, metricType) => {
    if (!dataMap || Object.keys(dataMap).length === 0) {
      return (
        <div className="h-40 flex items-center justify-center text-gray-400 font-bold text-xs">
          No data entries recorded yet.
        </div>
      );
    }

    const entries = Object.entries(dataMap);
    const labels = entries.map(([k]) => k);
    const values = entries.map(([, v]) => Number(v));

    const svgWidth = 500;
    const svgHeight = 150;
    const paddingLeft = 45;
    const paddingRight = 10;
    const paddingTop = 15;
    const paddingBottom = 25;

    const plotWidth = svgWidth - paddingLeft - paddingRight;
    const plotHeight = svgHeight - paddingTop - paddingBottom;

    const maxValue = Math.max(...values, 0) || (metricType === "RUPEE" ? 1000 : 10);

    const points = entries.map(([label, val], index) => {
      const x = paddingLeft + (index / (entries.length - 1 || 1)) * plotWidth;
      const y = paddingTop + plotHeight - (Number(val) / maxValue) * plotHeight;
      return { x, y, label, val: Number(val) };
    });

    let linePath = "";
    if (points.length > 0) {
      linePath = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ");
    }

    let areaPath = "";
    if (points.length > 0) {
      areaPath = `M ${points[0].x} ${paddingTop + plotHeight} ` +
                 points.map(p => `L ${p.x} ${p.y}`).join(" ") +
                 ` L ${points[points.length - 1].x} ${paddingTop + plotHeight} Z`;
    }

    return (
      <div className="relative">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto">
          <defs>
            <linearGradient id={`grad-${metricType}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid Lines */}
          {[0, 0.5, 1].map((ratio, i) => {
            const y = paddingTop + plotHeight - ratio * plotHeight;
            return (
              <g key={i} className="opacity-30">
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke="#cbd5e1"
                  strokeWidth="0.8"
                  strokeDasharray="4 4"
                />
                <text x={paddingLeft - 8} y={y + 3} textAnchor="end" className="text-[8px] font-bold fill-gray-400">
                  {metricType === "RUPEE" ? `₹${Math.round(maxValue * ratio)}` : Math.round(maxValue * ratio)}
                </text>
              </g>
            );
          })}

          {/* Line & Area */}
          {areaPath && <path d={areaPath} fill={`url(#grad-${metricType})`} />}
          {linePath && <path d={linePath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />}

          {/* Nodes */}
          {points.map((p, idx) => (
            <g key={idx} className="group">
              <circle cx={p.x} cy={p.y} r="3" fill="#10b981" stroke="white" strokeWidth="1" />
              {idx % 2 === 0 && (
                <text x={p.x} y={paddingTop + plotHeight + 12} textAnchor="middle" className="text-[7px] font-bold fill-gray-400">
                  {p.label}
                </text>
              )}
              {/* Tooltip trigger */}
              <title>{`${p.label}: ${metricType === "RUPEE" ? `₹${p.val.toLocaleString("en-IN")}` : p.val}`}</title>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-[32px] p-12 border border-green-50 shadow-xl text-center space-y-4 max-w-6xl mx-auto">
        <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-gray-500 font-bold text-sm">Loading administrator overview analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-fadeIn font-outfit">
      {/* Header section with titles and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl">
            <LayoutDashboard size={26} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-emerald-950">Enterprise Overview</h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Control Center &bull; Live Platform Insights</p>
          </div>
        </div>
        <button
          onClick={fetchStats}
          className="self-start sm:self-center flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-5 py-3 rounded-2xl font-bold transition shadow-sm"
        >
          <RefreshCw size={16} />
          Sync Dashboard
        </button>
      </div>

      {/* Global Notifications */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-3 font-semibold animate-fadeIn">
          <CheckCircle className="text-emerald-600 flex-shrink-0" size={22} />
          <div className="text-sm">{success}</div>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl flex items-center gap-3 font-semibold animate-fadeIn">
          <AlertCircle className="text-red-600 flex-shrink-0" size={22} />
          <div className="text-sm">{error}</div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Revenue/Commission Card */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-800 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:scale-[1.02] transition duration-200">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-3 translate-y-3">
            <IndianRupee size={120} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider opacity-80">Fees Collected</span>
          <h3 className="text-2xl font-black mt-2">
            ₹{Number(stats?.totalCommission || 0).toLocaleString("en-IN")}
          </h3>
          <span className="text-[9px] font-bold opacity-75 block mt-2">
            Gross Volume: ₹{Number(stats?.totalRevenue || 0).toLocaleString("en-IN")}
          </span>
        </div>

        {/* Total Users */}
        <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm flex items-center justify-between hover:scale-[1.02] transition duration-200">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Total Users</span>
            <h3 className="text-2xl font-black text-emerald-950 mt-1">{stats?.totalUsers || 0}</h3>
            <span className="text-[9px] font-bold text-gray-400 block mt-1">Sellers: {stats?.totalSellers || 0}</span>
          </div>
          <div className="bg-emerald-50 text-emerald-700 p-2.5 rounded-xl">
            <Users size={22} />
          </div>
        </div>

        {/* Pending Sellers */}
        <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm flex items-center justify-between hover:scale-[1.02] transition duration-200 cursor-pointer" onClick={() => navigate("/admin/verification")}>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Pending Merchants</span>
            <h3 className={`text-2xl font-black mt-1 ${stats?.pendingSellers > 0 ? "text-yellow-600" : "text-emerald-950"}`}>
              {stats?.pendingSellers || 0}
            </h3>
            <span className="text-[9px] font-bold text-emerald-600 block mt-1 flex items-center gap-0.5">
              Review requests <ArrowRight size={10} />
            </span>
          </div>
          <div className="bg-yellow-50 text-yellow-700 p-2.5 rounded-xl">
            <ShieldCheck size={22} />
          </div>
        </div>

        {/* Catalog Volume */}
        <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm flex items-center justify-between hover:scale-[1.02] transition duration-200 cursor-pointer" onClick={() => navigate("/admin/moderation")}>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Products Catalog</span>
            <h3 className="text-2xl font-black text-emerald-950 mt-1">{stats?.totalProducts || 0}</h3>
            <span className="text-[9px] font-bold text-gray-400 block mt-1">Active: {stats?.activeProducts || 0}</span>
          </div>
          <div className="bg-emerald-50 text-emerald-700 p-2.5 rounded-xl">
            <Leaf size={22} />
          </div>
        </div>

        {/* Security Alerts */}
        <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm flex items-center justify-between hover:scale-[1.02] transition duration-200 cursor-pointer" onClick={() => navigate("/admin/fraud")}>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Heuristics Threats</span>
            <h3 className={`text-2xl font-black mt-1 ${stats?.activeFraudAlerts > 0 ? "text-red-600 animate-pulse font-black" : "text-emerald-950"}`}>
              {stats?.activeFraudAlerts || 0}
            </h3>
            <span className="text-[9px] font-bold text-gray-400 block mt-1">Active alerts</span>
          </div>
          <div className={`p-2.5 rounded-xl ${stats?.activeFraudAlerts > 0 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"}`}>
            <ShieldAlert size={22} />
          </div>
        </div>
      </div>

      {/* SVG Charts section */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-[32px] border border-gray-150 p-6 shadow-sm space-y-4">
          <h3 className="font-extrabold text-emerald-950 flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-600" /> Monthly Fees Stream
          </h3>
          <div className="bg-slate-50/50 rounded-2xl p-4 border border-gray-100/50">
            {drawLineChart(stats?.monthlyCommissionTrend, "RUPEE")}
          </div>
        </div>

        <div className="bg-white rounded-[32px] border border-gray-150 p-6 shadow-sm space-y-4">
          <h3 className="font-extrabold text-emerald-950 flex items-center gap-2">
            <Users size={18} className="text-emerald-600" /> Registration Growth Curve
          </h3>
          <div className="bg-slate-50/50 rounded-2xl p-4 border border-gray-100/50">
            {drawLineChart(stats?.monthlyUserRegistrationTrend, "COUNT")}
          </div>
        </div>
      </div>

      {/* Dynamic Actions Center / Quick verifications and security logs */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Fraud alerts quick dashboard list */}
        <div className="lg:col-span-2 bg-white rounded-[32px] border border-gray-150 p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <h3 className="font-extrabold text-emerald-950 flex items-center gap-2">
                <ShieldAlert className="text-red-500" size={18} />
                Security Governance Warning Logs
              </h3>
              <span className="text-[9px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded uppercase">
                Active alerts
              </span>
            </div>
            
            <LiveFraudAlertsList fetchTrigger={stats?.activeFraudAlerts} onBlock={handleBlockUser} />
          </div>

          <button
            onClick={() => navigate("/admin/fraud")}
            className="w-full mt-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
          >
            Review Security Monitoring <ArrowRight size={14} />
          </button>
        </div>

        {/* Shortcut links list info */}
        <div className="bg-white rounded-[32px] border border-gray-150 p-6 shadow-sm space-y-4">
          <h3 className="font-extrabold text-emerald-950 border-b border-gray-100 pb-3">
            Administrative Shortcuts
          </h3>
          
          <div className="space-y-3">
            {[
              { title: "Review Merchant Applications", path: "/admin/verification", desc: "Approve or reject pending seller KYC documents." },
              { title: "Manage Product Catalog", path: "/admin/moderation", desc: "Flag or activate listed fertilizers, equipment or crops." },
              { title: "Registered Accounts Registry", path: "/admin/users", desc: "Suspend, edit, or check user profiles." },
              { title: "Platform System Variables", path: "/admin/settings", desc: "Modify delivery flat costs, fee ratios, and storefront toggle states." }
            ].map((shortcut, i) => (
              <div
                key={i}
                onClick={() => navigate(shortcut.path)}
                className="p-4 bg-gray-50/50 hover:bg-emerald-50/20 border border-gray-100 rounded-2xl cursor-pointer hover:border-emerald-100 transition space-y-1 group"
              >
                <div className="font-extrabold text-sm text-emerald-950 flex items-center justify-between group-hover:text-emerald-700 transition">
                  {shortcut.title}
                  <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition duration-200 transform group-hover:translate-x-1" />
                </div>
                <p className="text-[10px] text-gray-400 font-semibold">{shortcut.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Child helper component to query fraud alerts in real-time
function LiveFraudAlertsList({ fetchTrigger, onBlock }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await api.get("/admin/analytics/fraud/alerts");
        setAlerts(res.data?.data || res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, [fetchTrigger]);

  if (loading) {
    return <div className="text-center py-6 text-xs text-gray-400">Checking security heuristics...</div>;
  }

  if (alerts.length === 0) {
    return <div className="text-center py-8 text-xs text-gray-400 font-bold">Excellent! No security anomalies detected.</div>;
  }

  return (
    <div className="space-y-3 mt-4 max-h-[300px] overflow-y-auto pr-1">
      {alerts.slice(0, 3).map((a) => (
        <div key={a.id} className="p-4 bg-gray-50/40 border border-gray-100 hover:border-red-100 rounded-2xl flex items-center justify-between gap-4 transition">
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-1.5">
              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                a.severity === "CRITICAL" ? "bg-red-600 text-white" :
                a.severity === "HIGH" ? "bg-red-100 text-red-800" :
                "bg-amber-100 text-amber-800"
              }`}>{a.severity}</span>
              <h4 className="font-extrabold text-emerald-950">{a.type}</h4>
            </div>
            <p className="text-[11px] text-gray-500 font-semibold">{a.detail}</p>
            <p className="text-[9px] text-gray-400 font-bold">User: {a.affectedUserEmail || "N/A"}</p>
          </div>
          {a.affectedUserId && (
            <button
              onClick={() => onBlock(a.affectedUserId, a.affectedUserEmail)}
              className="flex-shrink-0 text-[10px] font-black text-red-600 hover:bg-red-50 border border-red-150 px-3 py-1.5 rounded-lg transition"
            >
              <Lock size={12} className="inline mr-1" /> Block
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
