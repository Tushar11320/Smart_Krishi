import React from "react";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { useMaps } from "./MapProvider";

const DEFAULT_CENTER = { lat: 23.2599, lng: 77.4126 }; // Bhopal Center
const DEFAULT_CONTAINER_STYLE = { width: "100%", height: "400px" };

export default function GoogleMapComponent({
  center = DEFAULT_CENTER,
  zoom = 12,
  markers = [],
  containerStyle = DEFAULT_CONTAINER_STYLE,
  onMapLoad,
  ...props
}) {
  const { isLoaded, loadError } = useMaps();

  if (loadError) {
    return (
      <div className="flex items-center justify-center p-6 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl font-semibold text-sm">
        ⚠️ Failed to load Google Maps interface. Please verify your internet connection.
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
        <p className="mt-3 text-xs text-emerald-800 font-bold">Synchronising Maps Engine...</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden shadow-sm border border-emerald-100/40 relative">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={zoom}
        onLoad={onMapLoad}
        options={{
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            }
          ]
        }}
        {...props}
      >
        {markers.map((marker, idx) => (
          <Marker
            key={idx}
            position={{ lat: marker.lat, lng: marker.lng }}
            title={marker.title}
            onClick={marker.onClick}
            icon={marker.icon}
          />
        ))}
      </GoogleMap>
    </div>
  );
}
