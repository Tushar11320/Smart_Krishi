import React, { useState, useEffect } from "react";
import { GoogleMap, DirectionsService, DirectionsRenderer } from "@react-google-maps/api";
import { useMaps } from "./MapProvider";

const DEFAULT_STYLE = { width: "100%", height: "400px" };

export default function RouteMap({
  origin,
  destination,
  onRouteCalculated,
  containerStyle = DEFAULT_STYLE
}) {
  const { isLoaded, loadError } = useMaps();
  const [directions, setDirections] = useState(null);
  const [requestSent, setRequestSent] = useState(false);

  useEffect(() => {
    setDirections(null);
    setRequestSent(false);
  }, [origin?.lat, origin?.lng, destination?.lat, destination?.lng]);

  if (loadError) {
    return (
      <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl font-semibold text-xs text-center">
        ⚠️ Failed to display route map.
      </div>
    );
  }

  if (!isLoaded || !origin || !destination) {
    return (
      <div
        style={containerStyle}
        className="flex flex-col items-center justify-center bg-emerald-50/20 border border-emerald-100/30 rounded-2xl animate-pulse"
      >
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-xs text-emerald-800 font-bold">Initialising Navigation View...</p>
      </div>
    );
  }

  const directionsCallback = (res) => {
    if (res !== null) {
      if (res.status === "OK") {
        setDirections(res);
        setRequestSent(true);
        if (onRouteCalculated) {
          const leg = res.routes[0].legs[0];
          onRouteCalculated({
            distanceText: leg.distance.text,
            distanceValue: leg.distance.value,
            durationText: leg.duration.text,
            durationValue: leg.duration.value
          });
        }
      } else {
        logError("DirectionsRequest failed: " + res.status);
        setRequestSent(true);
      }
    }
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-emerald-100/40 relative shadow-sm">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={origin}
        zoom={12}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true
        }}
      >
        {!directions && !requestSent && (
          <DirectionsService
            options={{
              origin: { lat: Number(origin.lat), lng: Number(origin.lng) },
              destination: { lat: Number(destination.lat), lng: Number(destination.lng) },
              travelMode: window.google?.maps?.TravelMode?.DRIVING
            }}
            callback={directionsCallback}
          />
        )}
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: false,
              polylineOptions: {
                strokeColor: "#059669",
                strokeWeight: 5,
                strokeOpacity: 0.8
              }
            }}
          />
        )}
      </GoogleMap>
    </div>
  );
}

function logError(msg) {
  console.warn("[Directions API] " + msg);
}
