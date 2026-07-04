import React, { useState, useEffect } from "react";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { useMaps } from "./MapProvider";

const DEFAULT_CENTER = { lat: 23.2599, lng: 77.4126 };
const DEFAULT_STYLE = { width: "100%", height: "350px" };

export default function LocationPicker({
  initialLat,
  initialLon,
  onLocationChange,
  containerStyle = DEFAULT_STYLE
}) {
  const { isLoaded, loadError } = useMaps();

  const [position, setPosition] = useState(DEFAULT_CENTER);

  useEffect(() => {
    if (initialLat && initialLon) {
      setPosition({ lat: Number(initialLat), lng: Number(initialLon) });
    }
  }, [initialLat, initialLon]);

  if (loadError) {
    return (
      <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl font-semibold text-xs text-center">
        ⚠️ Failed to display location picker map.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        style={containerStyle}
        className="flex flex-col items-center justify-center bg-emerald-50/20 border border-emerald-100/30 rounded-2xl animate-pulse"
      >
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-xs text-emerald-800 font-bold">Synchronising Geolocation Layer...</p>
      </div>
    );
  }

  const handleDragEnd = (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setPosition({ lat, lng });
    if (onLocationChange) {
      onLocationChange({ lat, lng });
    }
  };

  const handleMapClick = (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setPosition({ lat, lng });
    if (onLocationChange) {
      onLocationChange({ lat, lng });
    }
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-emerald-100/40 relative shadow-sm">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={position}
        zoom={14}
        onClick={handleMapClick}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true
        }}
      >
        <Marker
          position={position}
          draggable={true}
          onDragEnd={handleDragEnd}
          title="Drag this pin to your exact location"
          animation={window.google?.maps?.Animation?.DROP}
        />
      </GoogleMap>
      <div className="absolute bottom-3 left-3 bg-emerald-950/80 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow border border-white/10 pointer-events-none">
        📍 Drag the marker or click the map to select coordinates
      </div>
    </div>
  );
}
