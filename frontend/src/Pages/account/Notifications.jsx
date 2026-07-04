import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { Bell, Check, Trash2, AlertCircle } from "lucide-react";

export default function Notifications() {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      fetchNotifications(parsed.id);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchNotifications = async (userId) => {
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await api.get(`/notifications/user/${userId}`);
      const content = response.data?.content || response.data?.data?.content || response.data?.data || [];
      setNotifications(Array.isArray(content) ? content : []);
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to fetch notifications.");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/mark-read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      window.dispatchEvent(new Event("storage")); // Trigger Topbar/Navbar updates
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    try {
      await api.put(`/notifications/user/${user.id}/mark-all-read`);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      window.dispatchEvent(new Event("storage"));
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to mark all read.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      window.dispatchEvent(new Event("storage"));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-gray-150 shadow">
        <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500 font-medium">Loading your alerts...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-8 border border-green-100 shadow-lg space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center pb-4 border-b border-gray-100">
        <div>
          <h3 className="text-2xl font-black text-green-950 flex items-center gap-2">
            <Bell className="text-green-600" size={24} />
            My Notifications
          </h3>
          <p className="text-xs text-gray-400 font-bold mt-1">Check recent updates, order statuses, and transaction updates.</p>
        </div>

        {notifications.length > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs font-black text-green-700 bg-green-50 border border-green-200 px-4 py-2 rounded-xl transition hover:bg-green-100 cursor-pointer"
          >
            Mark All Read
          </button>
        )}
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-center gap-3 font-medium text-sm">
          <AlertCircle className="text-red-600" size={20} />
          {errorMessage}
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <Bell size={48} className="mx-auto text-gray-300 mb-4" />
          <h4 className="text-lg font-bold text-gray-700">No alerts yet</h4>
          <p className="text-sm text-gray-400 mt-1">You will receive system and status alerts as you place orders and rent machinery.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notif) => {
            let typeColor = "text-green-600 bg-green-50";
            if (notif.notificationType?.includes("FAILURE") || notif.notificationType?.includes("CANCELLED")) {
              typeColor = "text-red-600 bg-red-50";
            } else if (notif.notificationType?.includes("SUCCESS") || notif.notificationType?.includes("DELIVERED")) {
              typeColor = "text-emerald-600 bg-emerald-50";
            }

            return (
              <div
                key={notif.id}
                className={`p-5 rounded-2xl border transition flex gap-4 items-start ${
                  !notif.isRead
                    ? "bg-green-50/15 border-green-200"
                    : "bg-white border-gray-150"
                }`}
              >
                <div className="flex-1 space-y-1 text-left">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${typeColor}`}>
                      {notif.notificationType?.replace("_", " ") || "Alert"}
                    </span>
                    {!notif.isRead && (
                      <span className="w-1.5 h-1.5 bg-green-600 rounded-full shrink-0"></span>
                    )}
                    <span className="text-[10px] text-gray-400 font-bold">
                      {new Date(notif.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <h4 className={`text-sm font-extrabold ${!notif.isRead ? "text-gray-950" : "text-gray-700"}`}>
                    {notif.title}
                  </h4>
                  <p className="text-xs text-gray-550 leading-relaxed font-semibold">
                    {notif.message}
                  </p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  {!notif.isRead && (
                    <button
                      onClick={() => handleMarkRead(notif.id)}
                      className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl border border-emerald-150 transition cursor-pointer"
                      title="Mark as read"
                    >
                      <Check size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notif.id)}
                    className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl border border-red-150 transition cursor-pointer"
                    title="Delete alert"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
