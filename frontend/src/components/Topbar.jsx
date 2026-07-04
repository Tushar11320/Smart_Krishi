import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  Bell,
  Search,
  User,
  LogOut,
  Settings,
  HelpCircle,
  ChevronDown,
  ArrowLeft
} from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";

export default function Topbar({ toggleMobileSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  // Search parameters inside Topbar
  const [search, setSearch] = useState("");
  const searchRoutes = {
    machinery: "/machinery",
    "machinery rental": "/machinery-rental",
    "machinery rentals": "/machinery-rental",
    rental: "/machinery-rental",
    rentals: "/machinery-rental",
    rent: "/machinery-rental",
    weather: "/weather",
    crop: "/farming-crop",
    crops: "/farming-crop",
    fertilizer: "/fertilizers",
    fertilizers: "/fertilizers",
    land: "/landselling",
    milk: "/milk",
    water: "/water-supply",
    building: "/building-materials",
    materials: "/building-materials",
  };

  const performSearch = () => {
    const value = search.toLowerCase().trim();
    if (!value) {
      toast.error("Please enter a term to search");
      return;
    }
    const route = searchRoutes[value];
    if (route) {
      navigate(route);
    } else {
      toast.error(`No page found for "${value}". Try 'crops', 'machinery', or 'weather'.`);
    }
  };

  const handleSearch = (e) => {
    if (e.key === "Enter") {
      performSearch();
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, [location]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const fetchInitialData = async () => {
      try {
        const countRes = await api.get(`/notifications/user/${user.id}/unread-count`);
        setUnreadCount(countRes.data?.data ?? 0);

        const listRes = await api.get(`/notifications/user/${user.id}?size=5`);
        setNotifications(listRes.data?.data?.content || []);
      } catch (err) {
        console.error("Error fetching notifications in topbar:", err);
      }
    };

    fetchInitialData();

    const token = localStorage.getItem("token");
    if (!token) return;

    const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
    const wsProtocol = apiBase.startsWith("https") ? "wss" : "ws";
    const wsHost = apiBase.replace(/^https?:\/\//, "").replace(/\/api$/, "");
    const wsUrl = `${wsProtocol}://${wsHost}/ws/notifications?token=${token}`;

    let socket;
    let reconnectTimeout;

    const connectSocket = () => {
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log("Notifications WebSocket connected");
      };

      socket.onmessage = (event) => {
        try {
          const newNotif = JSON.parse(event.data);
          setNotifications((prev) => [newNotif, ...prev.slice(0, 4)]);
          setUnreadCount((prev) => prev + 1);
          
          toast.success(
            <div className="flex flex-col gap-0.5 text-xs text-left font-outfit">
              <span className="font-bold text-green-800">{newNotif.title}</span>
              <span className="text-gray-600">{newNotif.message}</span>
            </div>,
            { duration: 5000, position: "top-right" }
          );
        } catch (e) {
          console.error("Failed to parse WebSocket message", e);
        }
      };

      socket.onclose = () => {
        console.log("Notifications WebSocket closed, reconnecting in 5s...");
        reconnectTimeout = setTimeout(connectSocket, 5000);
      };

      socket.onerror = (err) => {
        console.error("Notifications WebSocket error:", err);
        socket.close();
      };
    };

    connectSocket();

    return () => {
      if (socket) socket.close();
      clearTimeout(reconnectTimeout);
    };
  }, [user]);

  const handleMarkAllRead = async () => {
    if (!user) return;
    try {
      await api.put(`/notifications/user/${user.id}/mark-all-read`);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (err) {
      console.error("Failed to mark all notifications read:", err);
    }
  };

  const handleMarkSingleRead = async (id, actionUrl) => {
    try {
      await api.put(`/notifications/${id}/mark-read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      if (actionUrl) {
        navigate(actionUrl);
      }
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setProfileOpen(false);
    navigate("/account/profile");
    window.location.reload();
  };

  // Resolve breadcrumbs path formatting
  const getBreadcrumbs = () => {
    const paths = location.pathname.split("/").filter(Boolean);
    if (paths.length === 0) return [{ label: "Dashboard", active: true }];

    return paths.map((path, index) => {
      const label = path
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      const to = "/" + paths.slice(0, index + 1).join("/");
      return {
        label: label === "Farmings" ? "Farming" : label,
        to,
        active: index === paths.length - 1
      };
    });
  };

  const breadcrumbs = getBreadcrumbs();

  if (isMobileSearchOpen) {
    return (
      <header className="h-20 border-b border-gray-150 bg-white sticky top-0 z-30 flex items-center justify-between px-4 shadow-sm font-outfit animate-fadeIn">
        <div className="flex items-center gap-2 w-full">
          <button
            onClick={() => setIsMobileSearchOpen(false)}
            className="p-2 text-gray-500 hover:text-green-800 hover:bg-gray-50 rounded-xl transition cursor-pointer"
            aria-label="Close Search"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-grow relative">
            <Search className="absolute left-3.5 top-3.5 text-gray-400" size={16} />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  performSearch();
                  setIsMobileSearchOpen(false);
                }
              }}
              placeholder='Search crops, machinery, weather...'
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-green-600 focus:bg-white focus:outline-none rounded-xl text-xs font-semibold transition"
            />
          </div>
          <button
            onClick={() => {
              performSearch();
              setIsMobileSearchOpen(false);
            }}
            className="px-4 py-2.5 bg-[#0f5132] hover:bg-[#0c4128] text-white text-xs font-black rounded-xl transition shadow-md cursor-pointer"
          >
            Go
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="h-20 border-b border-gray-150 bg-white sticky top-0 z-30 flex items-center justify-between px-6 shadow-sm font-outfit">
      {/* Left: Dynamic titles */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleMobileSidebar}
          className="p-2 text-gray-500 hover:text-green-800 hover:bg-gray-50 rounded-xl lg:hidden transition cursor-pointer"
          aria-label="Toggle Navigation Menu"
        >
          <Menu size={20} />
        </button>

        <div className="flex flex-col text-left">
          <h2 className="text-lg font-black text-green-955 leading-tight">
            {location.pathname === "/" || location.pathname === "/dashboard" 
              ? "Dashboard" 
              : breadcrumbs[breadcrumbs.length - 1]?.label || "Smart Krishi"}
          </h2>
          <span className="text-[10px] text-gray-400 font-extrabold mt-0.5">
            {location.pathname === "/" || location.pathname === "/dashboard"
              ? "Welcome back, Farmer!"
              : "Smart Krishi Portal"}
          </span>
        </div>
      </div>

      {/* Center: Search panel */}
      <div className="hidden lg:flex items-center gap-2 max-w-xl w-full px-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-3.5 text-gray-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearch}
            placeholder='Search services: "machinery", "weather", "crop", "fertilizer", "land"...'
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-green-600 focus:bg-white focus:outline-none rounded-xl text-xs font-semibold transition"
          />
        </div>
        <button
          onClick={performSearch}
          className="px-5 py-2.5 bg-[#0f5132] hover:bg-[#0c4128] text-white text-xs font-black rounded-xl transition shadow-md cursor-pointer"
        >
          Search
        </button>
      </div>

      {/* Right Area: Alerts & User Profile */}
      <div className="flex items-center gap-4">
        {/* Mobile Search Button */}
        <button
          onClick={() => setIsMobileSearchOpen(true)}
          className="p-2.5 text-gray-500 hover:text-green-800 hover:bg-gray-50 rounded-xl transition lg:hidden cursor-pointer"
          aria-label="Open Search Mode"
        >
          <Search size={18} />
        </button>

        {/* Notifications Icon */}
        <div className="relative flex items-center">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2.5 text-gray-500 hover:text-green-800 hover:bg-gray-50 rounded-xl transition relative cursor-pointer"
            aria-label="View Alerts Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4.5 h-4.5 bg-orange-500 text-white rounded-full text-[9px] font-black flex items-center justify-center border-2 border-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute top-12 right-0 bg-white border border-gray-100 rounded-2xl shadow-xl w-80 p-4 z-50 space-y-3 animate-fadeIn">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="font-extrabold text-xs text-gray-800 flex items-center gap-1.5">
                  Recent Alerts
                  {unreadCount > 0 && (
                    <span className="bg-orange-500 text-white rounded-full text-[9px] px-1.5 py-0.5 font-bold">
                      {unreadCount}
                    </span>
                  )}
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[10px] text-green-750 font-black hover:underline cursor-pointer bg-transparent border-0 outline-none"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="space-y-2.5 divide-y divide-gray-100 max-h-64 overflow-y-auto pr-1">
                {notifications.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 text-[11px] font-semibold">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((notif) => {
                    let typeColor = "text-green-600 bg-green-50";
                    if (notif.notificationType?.includes("FAILURE") || notif.notificationType?.includes("CANCELLED")) {
                      typeColor = "text-red-600 bg-red-50";
                    } else if (notif.notificationType?.includes("SUCCESS") || notif.notificationType?.includes("DELIVERED")) {
                      typeColor = "text-emerald-600 bg-emerald-50";
                    } else if (notif.notificationType?.includes("REFUND")) {
                      typeColor = "text-orange-600 bg-orange-50";
                    } else if (notif.notificationType?.includes("SHIPPED") || notif.notificationType?.includes("DELIVERY")) {
                      typeColor = "text-blue-600 bg-blue-50";
                    }
                    
                    return (
                      <div
                        key={notif.id}
                        onClick={() => {
                          let path = null;
                          if (notif.relatedEntityType === "ORDER" && notif.relatedEntityId) {
                            path = `/orders/${notif.relatedEntityId}/track`;
                          }
                          handleMarkSingleRead(notif.id, path);
                          setNotificationsOpen(false);
                        }}
                        className={`pt-2.5 first:pt-0 group cursor-pointer transition-colors p-1.5 rounded-lg ${
                          !notif.isRead ? "bg-green-50/20 hover:bg-green-50/40" : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${typeColor}`}>
                            {notif.notificationType?.replace("_", " ") || "Alert"}
                          </span>
                          {!notif.isRead && (
                            <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                          )}
                        </div>
                        <h4 className={`text-xs mt-1 font-bold ${!notif.isRead ? "text-gray-950" : "text-gray-700"}`}>
                          {notif.title}
                        </h4>
                        <p className="text-[11px] text-gray-500 mt-0.5 leading-normal">
                          {notif.message}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="border-t border-gray-100 pt-2 text-center">
                <Link
                  to="/account/notifications"
                  onClick={() => setNotificationsOpen(false)}
                  className="text-[10px] text-green-705 hover:text-green-800 font-extrabold hover:underline"
                >
                  View All Notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Account Avatar Trigger */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 text-gray-700 flex items-center justify-center font-black text-xs shadow-inner overflow-hidden">
            {user?.profileImage ? (
              <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
            ) : user ? (
              user.firstName[0] + user.lastName[0]
            ) : (
              <User size={16} />
            )}
          </div>
          
          <div className="relative">
            <button
              onClick={() => user ? setProfileOpen(!profileOpen) : navigate("/account")}
              className="flex items-center gap-1.5 bg-[#0f5132] hover:bg-[#0c4128] text-white text-xs font-black px-4.5 py-2.5 rounded-xl shadow transition cursor-pointer"
            >
              <span>{user ? user.firstName : "Account Portal"}</span>
              <ChevronDown size={14} />
            </button>

            {user && profileOpen && (
              <div className="absolute right-0 top-12 bg-white border border-gray-150 rounded-2xl shadow-xl w-48 py-2 z-50 animate-fadeIn text-xs text-gray-600 font-semibold">
                <Link
                  to="/account/profile"
                  className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-50 hover:text-green-800 transition"
                  onClick={() => setProfileOpen(false)}
                >
                  <User size={14} /> My Profile
                </Link>
                <Link
                  to="/account/settings"
                  className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-50 hover:text-green-800 transition"
                  onClick={() => setProfileOpen(false)}
                >
                  <Settings size={14} /> Settings
                </Link>
                <div className="border-t border-gray-100 my-1"></div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 hover:bg-red-50 text-red-600 hover:text-red-700 transition font-bold"
                >
                  <LogOut size={14} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
