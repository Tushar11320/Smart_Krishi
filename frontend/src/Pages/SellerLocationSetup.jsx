import React, { useState, useEffect } from "react";
import { GoogleMap, Marker, Circle } from "@react-google-maps/api";
import { MapProvider } from "../components/MapProvider";
import AddressAutocomplete from "../components/AddressAutocomplete";
import MapsService from "../services/MapsService";
import api from "../services/api";
import { MapPin, Navigation, Save, Store, Truck, Info, Settings, ShieldAlert } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const DEFAULT_CENTER = { lat: 23.2599, lng: 77.4126 };

export default function SellerLocationSetup() {
  const [user, setUser] = useState(null);
  const [sellerProfile, setSellerProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loading, setLoading] = useState(false);

  // Shop Coordinates and Delivery Radius
  const [coords, setCoords] = useState(DEFAULT_CENTER);
  const [address, setAddress] = useState("");
  const [radiusKm, setRadiusKm] = useState(15);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      fetchSellerProfile(parsed.id);
    } else {
      setLoadingProfile(false);
    }
  }, []);

  const fetchSellerProfile = async (userId) => {
    setLoadingProfile(true);
    try {
      const response = await api.get(`/sellers/user/${userId}`);
      const profile = response.data?.data || response.data;
      setSellerProfile(profile);
      
      if (profile) {
        // Load existing coordinates if set
        if (profile.latitude && profile.longitude) {
          setCoords({ lat: Number(profile.latitude), lng: Number(profile.longitude) });
          resolveAddress(profile.latitude, profile.longitude);
        } else {
          detectBrowserLocation();
        }

        // Try fetching existing delivery zone
        try {
          const zoneCheck = await api.get(`/location/delivery-zone/check`, {
            params: {
              sellerId: profile.id,
              customerLat: profile.latitude || DEFAULT_CENTER.lat,
              customerLon: profile.longitude || DEFAULT_CENTER.lng
            }
          });
          const zoneData = zoneCheck.data?.data || zoneCheck.data;
          if (zoneData && zoneData.radiusKm) {
            setRadiusKm(zoneData.radiusKm);
          }
        } catch (zoneErr) {
          console.log("No existing delivery zone configured yet.");
        }
      }
    } catch (err) {
      console.error("Failed to load seller profile details", err);
      toast.error("You must register as a Seller/Merchant to access this configuration.");
    } finally {
      setLoadingProfile(false);
    }
  };

  const detectBrowserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const pos = { lat: latitude, lng: longitude };
          setCoords(pos);
          resolveAddress(latitude, longitude);
        },
        (error) => {
          console.warn("GPS access denied, defaulting to Bhopal center.");
          setAddress("Bhopal, Madhya Pradesh, India");
        }
      );
    }
  };

  const resolveAddress = async (lat, lng) => {
    try {
      const res = await MapsService.reverseGeocode(lat, lng);
      if (res.data) {
        setAddress(res.data);
      }
    } catch (e) {
      console.error("Reverse geocoding error:", e);
    }
  };

  const handleLocationChange = (newCoords) => {
    setCoords(newCoords);
    resolveAddress(newCoords.lat, newCoords.lng);
  };

  const handleDragEnd = (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    handleLocationChange({ lat, lng });
  };

  const handleMapClick = (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    handleLocationChange({ lat, lng });
  };

  const handleAutocompleteSelected = (data) => {
    setCoords({ lat: data.latitude, lng: data.longitude });
    setAddress(data.formattedAddress);
  };

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    const toastId = toast.loading("Detecting shop coordinates...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });
        resolveAddress(latitude, longitude);
        toast.success("Shop position detected!", { id: toastId });
      },
      (error) => {
        toast.error("GPS access denied.", { id: toastId });
      }
    );
  };

  const handleSaveSetup = async () => {
    if (!sellerProfile) {
      toast.error("No active merchant account found.");
      return;
    }

    try {
      setLoading(true);
      // Save delivery zone to DB
      await MapsService.saveDeliveryZone(sellerProfile.id, radiusKm, coords.lat, coords.lng);
      
      // Also update seller profile table coordinate fields if needed
      try {
        await api.put(`/sellers/${sellerProfile.id}`, {
          ...sellerProfile,
          latitude: coords.lat,
          longitude: coords.lng,
          shopAddress: address || sellerProfile.shopAddress
        });
      } catch (putErr) {
        console.warn("Failed to synchronize coordinates to base seller profile table, zone configuration active.", putErr);
      }

      toast.success("Store location and delivery range saved successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update store serviceability settings.");
    } finally {
      setLoading(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="w-full min-h-screen bg-green-50/20 flex flex-col justify-center items-center font-outfit">
        <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-extrabold mt-4 text-xs">Loading Store Profile Context...</p>
      </div>
    );
  }

  if (!sellerProfile) {
    return (
      <div className="w-full min-h-screen bg-green-50/20 flex justify-center items-center p-6 font-outfit">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-emerald-100 shadow-xl text-center space-y-4">
          <ShieldAlert className="text-amber-500 mx-auto" size={48} />
          <h2 className="text-2xl font-black text-emerald-950">Access Unauthorized</h2>
          <p className="text-gray-500 text-xs leading-relaxed">
            This module is reserved for registered sellers. Please onboard as a merchant in your account profile first to map shop coordinates.
          </p>
        </div>
      </div>
    );
  }

  return (
    <MapProvider>
      <div className="w-full min-h-screen bg-gradient-to-br from-emerald-50/10 via-white to-green-50/10 py-8 px-4 md:px-8 font-outfit">
        <Toaster position="top-right" />
        
        <div className="max-w-5xl mx-auto space-y-6">
          
          {/* Header */}
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-600/10 text-emerald-700 rounded-2xl">
                <Store size={24} />
              </div>
              <h1 className="text-3xl font-black text-emerald-950 tracking-tight">Shop Geolocation Setup</h1>
            </div>
            <p className="text-emerald-800/70 font-semibold text-xs mt-1 pl-1">
              Configure your storefront marker and define your custom local delivery coverage range.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Control Form */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Profile Card Summary */}
              <div className="bg-white border border-emerald-150 p-5 rounded-3xl shadow-sm space-y-3.5">
                <h3 className="font-extrabold text-emerald-950 text-sm flex items-center gap-2">
                  <Settings className="text-emerald-600" size={16} /> Store Profile Detail
                </h3>
                <div className="text-xs space-y-2 border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-bold">Shop Name:</span>
                    <span className="text-emerald-950 font-black">{sellerProfile.businessName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-bold">Category:</span>
                    <span className="text-emerald-950 font-black">{sellerProfile.businessType || "Farmer"}</span>
                  </div>
                </div>
              </div>

              {/* Autocomplete and Manual Inputs */}
              <div className="bg-white border border-emerald-150 p-5 rounded-3xl shadow-sm space-y-4">
                <h3 className="font-extrabold text-emerald-950 text-sm flex items-center gap-2">
                  <MapPin className="text-emerald-600" size={16} /> Store Pin Location
                </h3>
                
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 font-black uppercase">Search Address</label>
                  <AddressAutocomplete onAddressSelected={handleAutocompleteSelected} placeholder="Search shop street..." />
                </div>

                <button
                  onClick={handleDetectGPS}
                  className="w-full py-2.5 rounded-2xl border border-emerald-100 hover:bg-emerald-50/50 text-emerald-700 font-bold text-xs flex items-center justify-center gap-2 transition"
                >
                  <Navigation size={14} className="fill-emerald-700/10" /> Use GPS Location
                </button>

                {address && (
                  <div className="bg-emerald-50/20 p-3 rounded-2xl border border-emerald-100/20 text-xs">
                    <span className="font-black text-emerald-800 block mb-1">Geocoded Address</span>
                    <span className="text-emerald-950/80 font-semibold leading-relaxed">{address}</span>
                  </div>
                )}
              </div>

              {/* Delivery Zone Radius Slider */}
              <div className="bg-white border border-emerald-150 p-5 rounded-3xl shadow-sm space-y-4">
                <h3 className="font-extrabold text-emerald-950 text-sm flex items-center gap-2">
                  <Truck className="text-emerald-600" size={16} /> Delivery Service Range
                </h3>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-gray-500">Service Coverage</span>
                    <span className="text-emerald-600 font-black">{radiusKm} km</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="80"
                    step="1"
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(Number(e.target.value))}
                    className="w-full h-2 bg-emerald-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                </div>

                <div className="flex gap-2 text-[10px] text-gray-500 font-medium leading-relaxed bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <Info size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    Orders placed beyond this circle will trigger serviceability errors on the customer checkout page.
                  </span>
                </div>

                <button
                  onClick={handleSaveSetup}
                  disabled={loading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 transition shadow-md"
                >
                  <Save size={16} /> Save Configurations
                </button>
              </div>

            </div>

            {/* Map Area */}
            <div className="lg:col-span-2 relative h-[580px] rounded-3xl border border-emerald-150 overflow-hidden shadow-sm bg-white">
              <GoogleMap
                mapContainerStyle={{ width: "100%", height: "100%" }}
                center={coords}
                zoom={13}
                onClick={handleMapClick}
                options={{
                  streetViewControl: false,
                  mapTypeControl: false,
                  fullscreenControl: true
                }}
              >
                {/* Draggable Shop Marker */}
                <Marker
                  position={coords}
                  draggable={true}
                  onDragEnd={handleDragEnd}
                  title="Drag to your exact store building location"
                  icon={{
                    url: "https://maps.google.com/mapfiles/ms/icons/red-pushpin.png",
                    scaledSize: new window.google.maps.Size(40, 40)
                  }}
                />

                {/* Service Range Circle Overlay */}
                <Circle
                  center={coords}
                  radius={radiusKm * 1000}
                  options={{
                    strokeColor: "#059669",
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillColor: "#10B981",
                    fillOpacity: 0.15,
                    clickable: false,
                    editable: false
                  }}
                />
              </GoogleMap>
              
              <div className="absolute bottom-3 left-3 bg-emerald-950/80 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-2 rounded-xl shadow border border-white/10 max-w-xs pointer-events-none">
                📍 Drag marker to set storefront coordinates. Delivery radius updates live.
              </div>
            </div>

          </div>

        </div>
      </div>
    </MapProvider>
  );
}
