import React, { createContext, useContext } from "react";
import { useJsApiLoader } from "@react-google-maps/api";

const MapsContext = createContext({ isLoaded: false, loadError: null });

const LIBRARIES = ["places", "drawing", "geometry"];

export function MapProvider({ children }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: LIBRARIES
  });

  return (
    <MapsContext.Provider value={{ isLoaded, loadError }}>
      {children}
    </MapsContext.Provider>
  );
}

export function useMaps() {
  return useContext(MapsContext);
}
