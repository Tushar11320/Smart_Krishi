import React, { useRef } from "react";
import { Autocomplete } from "@react-google-maps/api";
import { useMaps } from "./MapProvider";

export default function AddressAutocomplete({
  onAddressSelected,
  placeholder = "Search street, landmark, or city name..."
}) {
  const { isLoaded, loadError } = useMaps();
  const autocompleteRef = useRef(null);

  if (loadError) {
    return (
      <input
        type="text"
        disabled
        placeholder="Map autocomplete unavailable"
        className="w-full pl-4 pr-4 py-2.5 rounded-2xl bg-rose-50 border border-rose-100 font-semibold text-rose-700 text-sm opacity-50"
      />
    );
  }

  if (!isLoaded) {
    return (
      <input
        type="text"
        disabled
        placeholder="Connecting Autocomplete Services..."
        className="w-full pl-4 pr-4 py-2.5 rounded-2xl bg-emerald-50/20 border border-emerald-100/20 font-semibold text-emerald-800/50 text-sm animate-pulse"
      />
    );
  }

  const handlePlaceChanged = () => {
    if (autocompleteRef.current !== null) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        
        let streetNumber = "";
        let route = "";
        let village = "";
        let city = "";
        let district = "";
        let state = "";
        let pincode = "";

        const addressComponents = place.address_components || [];
        for (const comp of addressComponents) {
          const types = comp.types;
          if (types.includes("street_number")) {
            streetNumber = comp.long_name;
          }
          if (types.includes("route")) {
            route = comp.long_name;
          }
          if (types.includes("sublocality") || types.includes("sublocality_level_1") || types.includes("neighborhood")) {
            village = comp.long_name;
          }
          if (types.includes("locality")) {
            city = comp.long_name;
          }
          if (types.includes("administrative_area_level_3")) {
            district = comp.long_name;
          }
          if (types.includes("administrative_area_level_1")) {
            state = comp.long_name;
          }
          if (types.includes("postal_code")) {
            pincode = comp.long_name;
          }
        }

        const street = `${streetNumber} ${route}`.trim();
        const finalCity = city || village || district || "Bhopal";
        const finalDistrict = district || city || "Bhopal";

        if (onAddressSelected) {
          onAddressSelected({
            formattedAddress: place.formatted_address,
            street: street || "Main Road",
            village: village || "",
            city: finalCity,
            district: finalDistrict,
            state: state || "Madhya Pradesh",
            pincode: pincode || "462001",
            latitude: lat,
            longitude: lng
          });
        }
      }
    }
  };

  return (
    <Autocomplete
      onLoad={(autocomplete) => (autocompleteRef.current = autocomplete)}
      onPlaceChanged={handlePlaceChanged}
      options={{
        componentRestrictions: { country: "in" },
        fields: ["address_components", "geometry", "formatted_address"]
      }}
    >
      <input
        type="text"
        placeholder={placeholder}
        className="w-full pl-4 pr-4 py-2.5 rounded-2xl bg-white border border-emerald-100 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 font-semibold text-emerald-950 shadow-sm transition-all text-sm"
      />
    </Autocomplete>
  );
}
