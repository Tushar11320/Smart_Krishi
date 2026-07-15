import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { GoogleMap, Marker, Polyline } from "@react-google-maps/api";
import { MapProvider } from "../components/MapProvider";
import api, { formatPrice, API_BASE_URL } from "../services/api";
import {
  MapPin,
  Truck,
  Navigation,
  Compass,
  EyeOff,
  Eye,
  Activity,
  FileText,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Phone,
  Map,
  Play,
  Pause,
  AlertCircle
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function OrderTracking() {
  const { orderId } = useParams();
  const [trackingData, setTrackingData] = useState(null);
  const [history, setHistory] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const [isSharingActive, setIsSharingActive] = useState(true);
  const [simIntervalId, setSimIntervalId] = useState(null);

  // Authentication context derived from localStorage
  const storedUser = localStorage.getItem("user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const token = localStorage.getItem("token");

  // Fetch tracking details and audit logs initially
  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const trackRes = await api.get(`/orders/${orderId}/tracking`);
      const tData = trackRes.data?.data || trackRes.data;
      setTrackingData(tData);
      
      if (tData.routeHistory) {
        try {
          setHistory(JSON.parse(tData.routeHistory));
        } catch (e) {
          console.error("Failed to parse route history JSON", e);
        }
      }

      // Sync local sharing toggle with tracking status
      if (tData.status === "TRACKING_PAUSED") {
        setIsSharingActive(false);
      }

      // Fetch audit logs
      try {
        const logsRes = await api.get(`/orders/${orderId}/tracking/logs`);
        setAuditLogs(logsRes.data?.data || logsRes.data || []);
      } catch (logErr) {
        console.warn("Could not fetch audit logs", logErr);
      }

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load tracking data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [orderId]);

  // Establish live WebSocket connection
  useEffect(() => {
    if (!orderId || !token) return;

    // Derive WS URL from API_BASE_URL
    const apiBase = API_BASE_URL;
    const wsProto = apiBase.startsWith("https") ? "wss" : "ws";
    const wsHost = apiBase.replace(/^https?:\/\//, "").replace(/\/api$/, "");
    const wsUrl = `${wsProto}://${wsHost}/ws/track?orderId=${orderId}&token=${token}`;

    console.log("Connecting to tracking WebSocket at:", wsUrl);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("Connected to live tracking WebSocket server");
      setConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("WebSocket tracking update received:", data);
        setTrackingData(data);
        if (data.routeHistory) {
          try {
            setHistory(JSON.parse(data.routeHistory));
          } catch (e) {
            console.error("Failed to parse websocket routeHistory", e);
          }
        }

        // Refresh audit logs in background
        api.get(`/orders/${orderId}/tracking/logs`)
          .then(res => setAuditLogs(res.data?.data || res.data || []))
          .catch(() => {});

      } catch (err) {
        console.error("Failed to parse WebSocket message", err);
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket connection error:", err);
      setConnected(false);
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
      setConnected(false);
    };

    return () => {
      ws.close();
      if (simIntervalId) {
        clearInterval(simIntervalId);
      }
    };
  }, [orderId, token]);

  // Helper checks
  const isDriver = trackingData?.deliveryPartnerName && currentUser && 
      (trackingData.deliveryPartnerName.toLowerCase().includes(currentUser.firstName.toLowerCase()) || 
       currentUser.roles?.includes("DELIVERY") || currentUser.roles?.includes("ROLE_DELIVERY"));
  
  const isAdmin = currentUser?.roles?.includes("ADMIN") || currentUser?.roles?.includes("ROLE_ADMIN") || currentUser?.roles?.includes("SUPER_ADMIN");
  
  const isDriverOrAdmin = isDriver || isAdmin;
  const isDelivered = trackingData?.status === "DELIVERED";

  // Watch GPS location if user is driver and sharing is active
  useEffect(() => {
    if (!isDriver || !isSharingActive || isDelivered) return;

    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    const handleSuccess = (position) => {
      const { latitude, longitude } = position.coords;
      sendLocationUpdate(latitude, longitude);
    };

    const handleError = (error) => {
      console.warn("Geolocation watch error, using mock positioning: ", error.message);
    };

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, options);

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isDriver, isSharingActive, isDelivered]);

  // API Calls for updating location & status
  const sendLocationUpdate = async (lat, lng) => {
    try {
      const response = await api.post(`/orders/${orderId}/tracking/location`, null, {
        params: {
          latitude: lat,
          longitude: lng,
          etaMinutes: trackingData?.etaMinutes ?? 12
        }
      });
      const updated = response.data?.data || response.data;
      setTrackingData(updated);
    } catch (err) {
      console.error("Error updating location coordinates", err);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const response = await api.post(`/orders/${orderId}/tracking/status`, null, {
        params: { status: newStatus }
      });
      const updated = response.data?.data || response.data;
      setTrackingData(updated);
      toast.success(`Tracking status updated to ${newStatus}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  const handleAssignMockDriver = async () => {
    if (!currentUser) return;
    try {
      const response = await api.post(`/orders/${orderId}/tracking/assign`, null, {
        params: { deliveryUserId: currentUser.id }
      });
      const updated = response.data?.data || response.data;
      setTrackingData(updated);
      toast.success("Assigned yourself as the delivery partner!");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to assign driver");
    }
  };

  const toggleLocationSharing = async () => {
    const nextSharing = !isSharingActive;
    setIsSharingActive(nextSharing);
    
    const nextStatus = nextSharing ? "OUT_FOR_DELIVERY" : "TRACKING_PAUSED";
    await handleStatusChange(nextStatus);
  };

  // Location simulation for testing marker movements
  const startSimulation = () => {
    if (simIntervalId) {
      clearInterval(simIntervalId);
      setSimIntervalId(null);
      toast.success("Simulation stopped");
      return;
    }

    toast.success("Starting GPS route simulation...");
    let step = 0;
    const steps = 8;
    const startLat = 28.5639;
    const startLng = 77.1090;
    const destLat = trackingData?.destinationLatitude || 28.6139;
    const destLng = trackingData?.destinationLongitude || 77.2090;

    const id = setInterval(() => {
      if (step >= steps) {
        clearInterval(id);
        setSimIntervalId(null);
        handleStatusChange("DELIVERED");
        return;
      }
      const ratio = step / steps;
      const currentLat = startLat + (destLat - startLat) * ratio;
      const currentLng = startLng + (destLng - startLng) * ratio;
      sendLocationUpdate(currentLat, currentLng);
      step++;
    }, 4000);

    setSimIntervalId(id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-green-50/20 flex flex-col justify-center items-center font-outfit">
        <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-extrabold mt-4">Initializing Tracking Session...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-green-50/20 flex justify-center items-center p-6 font-outfit">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-red-100 shadow-xl text-center">
          <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
          <h2 className="text-2xl font-black text-green-950">Tracking Unavailable</h2>
          <p className="text-gray-500 mt-2">{error}</p>
          <Link to="/account" className="mt-6 inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl transition shadow-md">
            <ArrowLeft size={16} /> Return to Orders
          </Link>
        </div>
      </div>
    );
  }

  const currentLat = trackingData?.currentLatitude ? Number(trackingData.currentLatitude) : 28.5639;
  const currentLng = trackingData?.currentLongitude ? Number(trackingData.currentLongitude) : 77.1090;
  const destLat = trackingData?.destinationLatitude ? Number(trackingData.destinationLatitude) : 28.6139;
  const destLng = trackingData?.destinationLongitude ? Number(trackingData.destinationLongitude) : 77.2090;

  // Prepare path array for the Polyline component
  const pathCoordinates = history.map(point => ({
    lat: Number(point.lat),
    lng: Number(point.lng)
  }));
  if (trackingData?.currentLatitude && trackingData?.currentLongitude) {
    pathCoordinates.push({ lat: currentLat, lng: currentLng });
  }

  return (
    <MapProvider>
      <div className="min-h-screen bg-gradient-to-br from-green-50/40 via-white to-green-100/40 p-6 md:p-8 font-outfit">
        <Toaster position="top-right" />
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Navigation / Header */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <Link to="/account/orders" className="bg-white hover:bg-gray-50 border border-gray-150 p-2.5 rounded-xl transition text-gray-700">
                <ArrowLeft size={18} />
              </Link>
              <div>
                <h2 className="text-3xl font-black text-green-950">Live Order Tracking</h2>
                <p className="text-xs text-gray-400 font-bold mt-0.5">Order Ref: {trackingData?.orderId ? `ID #${trackingData.orderId}` : `N/A`}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <span className={`w-3 h-3 rounded-full ${connected ? "bg-green-500 animate-ping" : "bg-gray-400"}`}></span>
              <span className="text-xs font-black uppercase tracking-wider text-gray-500">
                {connected ? "WebSocket Connected" : "Connection Offline"}
              </span>
            </div>
          </div>

          {/* Dashboard Grid */}
          <div className="grid lg:grid-cols-12 gap-8">
            
            {/* Main Map Content - 8 Cols */}
            <div className="lg:col-span-8 h-[550px] relative rounded-3xl overflow-hidden shadow-lg border border-green-100 bg-white">
              <GoogleMap
                mapContainerStyle={{ width: "100%", height: "100%" }}
                center={{ lat: currentLat, lng: currentLng }}
                zoom={12}
                options={{
                  streetViewControl: false,
                  mapTypeControl: false,
                  fullscreenControl: true
                }}
              >
                {/* Destination Marker */}
                <Marker
                  position={{ lat: destLat, lng: destLng }}
                  title="Delivery Destination"
                  icon={{
                    url: "https://maps.google.com/mapfiles/ms/icons/red-pushpin.png",
                    scaledSize: new window.google.maps.Size(40, 40)
                  }}
                />

                {/* Driver/Vehicle Marker */}
                {trackingData?.currentLatitude && trackingData?.currentLongitude && (
                  <Marker
                    position={{ lat: currentLat, lng: currentLng }}
                    title={trackingData.deliveryPartnerName || "Delivery Driver"}
                    icon={{
                      url: "https://cdn-icons-png.flaticon.com/512/3063/3063822.png", // truck vector icon
                      scaledSize: new window.google.maps.Size(38, 38)
                    }}
                  />
                )}

                {/* Route Path History */}
                {pathCoordinates.length > 1 && (
                  <Polyline
                    path={pathCoordinates}
                    options={{
                      strokeColor: "#10B981",
                      strokeOpacity: 1.0,
                      strokeWeight: 4,
                      geodesic: true
                    }}
                  />
                )}
              </GoogleMap>
            </div>

            {/* Info & Controls Panel - 4 Cols */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Delivery Profile and Status Card */}
              <div className="bg-white rounded-3xl p-6 border border-green-100 shadow-md space-y-5">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Delivery Details</span>
                  <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${
                    trackingData?.status === "UNASSIGNED" ? "bg-yellow-50 text-yellow-700 border border-yellow-250" :
                    trackingData?.status === "ASSIGNED" ? "bg-indigo-50 text-indigo-700 border border-indigo-200" :
                    trackingData?.status === "PACKED" ? "bg-orange-50 text-orange-700 border border-orange-200" :
                    trackingData?.status === "PICKED_UP" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                    trackingData?.status === "OUT_FOR_DELIVERY" ? "bg-purple-50 text-purple-700 border border-purple-200" :
                    trackingData?.status === "DELIVERED" ? "bg-green-50 text-green-700 border border-green-200" :
                    "bg-amber-50 text-amber-700 border border-amber-200" // paused
                  }`}>
                    {trackingData?.status?.replace("_", " ")}
                  </span>
                </div>

                {/* Driver identity */}
                {trackingData?.deliveryPartnerName ? (
                  <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <div className="w-12 h-12 bg-green-600 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-sm">
                      {trackingData.deliveryPartnerName[0]}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-extrabold text-sm text-green-950">{trackingData.deliveryPartnerName}</h5>
                      <p className="text-[11px] text-gray-400 font-bold mt-0.5">{trackingData.vehicleType} • {trackingData.vehicleNumber}</p>
                    </div>
                    {trackingData.deliveryPartnerPhone && (
                      <a href={`tel:${trackingData.deliveryPartnerPhone}`} className="bg-white border border-gray-150 p-2 rounded-xl text-green-600 hover:bg-green-50 transition">
                        <Phone size={16} />
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-yellow-50/50 border border-dashed border-yellow-200 rounded-2xl space-y-3">
                    <Truck className="mx-auto text-yellow-600" size={32} />
                    <p className="text-xs text-yellow-800 font-bold">No delivery partner assigned yet</p>
                    {currentUser && (
                      <button
                        onClick={handleAssignMockDriver}
                        className="text-xs bg-yellow-600 hover:bg-yellow-700 text-white font-extrabold px-4 py-2 rounded-xl transition"
                      >
                        Onboard As Driver
                      </button>
                    )}
                  </div>
                )}

                {/* ETA Display */}
                {trackingData?.deliveryPartnerName && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 border border-gray-100 p-3.5 rounded-2xl">
                      <span className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1">
                        <Clock size={12} className="text-green-600" /> Live ETA
                      </span>
                      <span className="text-sm font-black text-green-950 mt-1 block">
                        {trackingData.etaMinutes ? `${trackingData.etaMinutes} mins` : "Unavailable"}
                      </span>
                    </div>

                    <div className="bg-gray-50 border border-gray-100 p-3.5 rounded-2xl">
                      <span className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1">
                        <Activity size={12} className="text-green-600" /> GPS Status
                      </span>
                      <span className={`text-xs font-black mt-1.5 block uppercase ${
                        trackingData.status === "TRACKING_PAUSED" ? "text-amber-600" :
                        trackingData.currentLatitude ? "text-green-600 animate-pulse" : "text-gray-500"
                      }`}>
                        {trackingData.status === "TRACKING_PAUSED" ? "PAUSED" : trackingData.currentLatitude ? "ACTIVE" : "OFFLINE"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Driver Control Deck (Visible only if driver or admin) */}
              {trackingData?.deliveryPartnerName && isDriverOrAdmin && (
                <div className="bg-white rounded-3xl p-6 border border-green-100 shadow-md space-y-4">
                  <h4 className="font-black text-green-950 text-sm flex items-center gap-2 border-b border-gray-50 pb-2">
                    <Compass className="text-green-600" size={18} /> Driver Actions Control Deck
                  </h4>

                  <div className="grid grid-cols-3 gap-2 text-xs font-extrabold">
                    <button
                      onClick={() => handleStatusChange("PACKED")}
                      disabled={isDelivered}
                      className="w-full bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 py-3 rounded-xl transition disabled:opacity-50"
                    >
                      Mark Packed
                    </button>
                    <button
                      onClick={() => handleStatusChange("PICKED_UP")}
                      disabled={isDelivered}
                      className="w-full bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 py-3 rounded-xl transition disabled:opacity-50"
                    >
                      Mark Picked Up
                    </button>
                    <button
                      onClick={() => handleStatusChange("OUT_FOR_DELIVERY")}
                      disabled={isDelivered}
                      className="w-full bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 py-3 rounded-xl transition disabled:opacity-50"
                    >
                      Out Delivery
                    </button>
                  </div>

                  <button
                    onClick={() => handleStatusChange("DELIVERED")}
                    disabled={isDelivered}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-black py-3.5 rounded-xl transition shadow-md"
                  >
                    Confirm Package Delivered ✔
                  </button>

                  {/* Privacy & Simulation Toggles */}
                  <div className="border-t border-gray-100 pt-4 space-y-2.5">
                    <button
                      onClick={toggleLocationSharing}
                      disabled={isDelivered}
                      className={`w-full py-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition ${
                        isSharingActive
                          ? "bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700"
                          : "bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
                      }`}
                    >
                      {isSharingActive ? (
                        <>
                          <Pause size={14} /> Pause Location Sharing (KYC Privacy)
                        </>
                      ) : (
                        <>
                          <Play size={14} /> Resume Location Sharing
                        </>
                      )}
                    </button>

                    <button
                      onClick={startSimulation}
                      disabled={isDelivered}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
                    >
                      {simIntervalId ? (
                        <>
                          <Pause size={14} /> Stop GPS Route Simulation
                        </>
                      ) : (
                        <>
                          <Play size={14} /> Start GPS Route Simulation
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Audit Logs Trail */}
              <div className="bg-white rounded-3xl p-6 border border-green-100 shadow-md space-y-4">
                <h4 className="font-black text-green-950 text-sm flex items-center gap-2 border-b border-gray-50 pb-2">
                  <FileText className="text-green-600" size={18} /> Location Audit Trail
                </h4>

                <div className="max-h-48 overflow-y-auto space-y-3.5 pr-2 custom-scrollbar text-xs font-semibold text-gray-600">
                  {auditLogs.length === 0 ? (
                    <p className="text-center py-4 text-gray-400 font-bold">No audit trail entries recorded yet</p>
                  ) : (
                    auditLogs.map((log) => (
                      <div key={log.id} className="flex gap-2.5 items-start">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-600 mt-1.5 flex-shrink-0"></div>
                        <div className="flex-1">
                          <p className="text-gray-800 font-bold">{log.details || log.action}</p>
                          <span className="text-[10px] text-gray-400 block mt-0.5">{new Date(log.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>
    </MapProvider>
  );
}
