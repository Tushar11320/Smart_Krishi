import React, { useState, useEffect, useRef } from "react";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { MapProvider, useMaps } from "../components/MapProvider";
import AddressAutocomplete from "../components/AddressAutocomplete";
import MapsService from "../services/MapsService";
import { MapPin, Navigation, Compass, SlidersHorizontal, ArrowUpDown, Star, ArrowRight, X } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

// Format price helper
const formatPrice = (price) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(price);
};

export default function NearbyProducts() {
  const { isLoaded } = useMaps();
  const [coords, setCoords] = useState({ lat: 23.2599, lng: 77.4126 }); // Default Bhopal
  const [address, setAddress] = useState("Bhopal, Madhya Pradesh, India");
  const [radius, setRadius] = useState(25);
  const [sortBy, setSortBy] = useState("distance");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [hoveredProductId, setHoveredProductId] = useState(null);
  
  const mapRef = useRef(null);

  // Load user current location on mount
  useEffect(() => {
    setLoading(true);
    MapsService.getCurrentLocation()
      .then((res) => {
        if (res.data && res.data.latitude && res.data.longitude) {
          const lat = res.data.latitude;
          const lng = res.data.longitude;
          setCoords({ lat, lng });
          resolveAddress(lat, lng);
        } else {
          // If no saved, detect browser location
          detectBrowserLocation();
        }
      })
      .catch((err) => {
        console.log("Failed to load initial user coordinates", err);
        detectBrowserLocation();
      });
  }, []);

  // Fetch products when coords, radius, or sortBy changes
  useEffect(() => {
    fetchNearbyProducts();
  }, [coords.lat, coords.lng, radius, sortBy]);

  const detectBrowserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCoords({ lat: latitude, lng: longitude });
          resolveAddress(latitude, longitude);
        },
        (error) => {
          console.warn("GPS access denied, defaulting to Bhopal coordinates.", error);
          fetchNearbyProducts();
        }
      );
    } else {
      fetchNearbyProducts();
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

  const fetchNearbyProducts = async () => {
    try {
      setLoading(true);
      const res = await MapsService.getNearbyProducts(coords.lat, coords.lng, radius, sortBy);
      // Backend returns a List of ProductDTO or ApiResponse wrapping it
      const list = res?.data || res || [];
      setProducts(list);
    } catch (err) {
      console.error("Failed to load nearby products:", err);
      toast.error("Could not fetch local product listings.");
    } finally {
      setLoading(false);
    }
  };

  const handleAutocompleteSelected = (data) => {
    setCoords({ lat: data.latitude, lng: data.longitude });
    setAddress(data.formattedAddress);
    toast.success(`Search location changed to ${data.city}`);
  };

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    const toastId = toast.loading("Detecting your location...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });
        resolveAddress(latitude, longitude);
        toast.success("Coordinates updated successfully!", { id: toastId });
      },
      (error) => {
        toast.error("GPS Access Denied. Search manually using autocomplete.", { id: toastId });
      }
    );
  };

  const handleMapLoad = (map) => {
    mapRef.current = map;
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    if (mapRef.current) {
      mapRef.current.panTo({ lat: Number(product.latitude), lng: Number(product.longitude) });
      mapRef.current.setZoom(13);
    }
  };

  return (
    <MapProvider>
      <div className="w-full min-h-screen bg-gradient-to-br from-emerald-50/10 via-white to-green-50/10 py-6 px-4 md:px-8 font-outfit">
        <Toaster position="top-right" />
        
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-100/40 pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-600/10 text-emerald-700 rounded-2xl">
                  <Navigation size={22} className="fill-emerald-700/10" />
                </div>
                <h1 className="text-3xl font-black text-emerald-950 tracking-tight">Nearby Listings Finder</h1>
              </div>
              <p className="text-emerald-800/70 font-semibold text-xs mt-1">
                Explore local crops, equipment, and resources within your radius using geolocated pins.
              </p>
            </div>

            {/* Address Search Bar */}
            <div className="flex items-center gap-2 max-w-md w-full">
              <div className="flex-1">
                <AddressAutocomplete onAddressSelected={handleAutocompleteSelected} placeholder="Filter location..." />
              </div>
              <button 
                onClick={handleDetectGPS}
                className="p-3 border border-emerald-100 bg-white hover:bg-emerald-50/30 text-emerald-700 rounded-2xl transition shadow-sm cursor-pointer"
                title="Detect GPS"
              >
                <Compass size={18} />
              </button>
            </div>
          </div>

          {/* Layout Grid */}
          <div className="grid lg:grid-cols-12 gap-6 lg:h-[calc(100vh-190px)] h-auto lg:min-h-[500px]">
            
            {/* Sidebar filters and product list */}
            <div className="lg:col-span-4 flex flex-col space-y-4 lg:h-full h-auto overflow-hidden">
              
              {/* Controls card */}
              <div className="bg-white border border-emerald-100/50 p-5 rounded-3xl shadow-sm space-y-4 flex-shrink-0">
                
                {/* Current filter address summary */}
                <div className="bg-emerald-50/20 rounded-2xl p-3 border border-emerald-100/20 text-xs flex gap-2">
                  <MapPin className="text-emerald-700 shrink-0 mt-0.5" size={15} />
                  <div>
                    <span className="font-bold text-emerald-800">Searching center: </span>
                    <span className="text-emerald-950/80 font-semibold">{address}</span>
                  </div>
                </div>

                {/* Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-emerald-950">
                    <span className="flex items-center gap-1.5"><SlidersHorizontal size={13} /> Distance Limit</span>
                    <span className="text-emerald-600 font-black">{radius} km</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="150"
                    step="5"
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    className="w-full h-2 bg-emerald-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                </div>

                {/* Sorting */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <ArrowUpDown size={13} /> Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold text-emerald-950 border border-emerald-100 rounded-xl focus:outline-none focus:border-emerald-600 bg-white"
                  >
                    <option value="distance">Distance (Closest first)</option>
                    <option value="price">Price (Low to High)</option>
                    <option value="rating">Rating (Highest first)</option>
                  </select>
                </div>

              </div>

              {/* Listings Scroll Box */}
              <div className="flex-grow lg:flex-1 h-[300px] lg:h-auto overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs font-bold text-emerald-800 mt-3 animate-pulse">Scanning local catalog...</p>
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-12 bg-white border border-dashed border-emerald-100 rounded-3xl space-y-2">
                    <MapPin className="mx-auto text-emerald-300" size={32} />
                    <p className="text-xs text-emerald-800/60 font-bold">No products found inside {radius}km</p>
                    <p className="text-[10px] text-emerald-800/40 font-semibold px-4">Try widening your search radius or changing coordinates above.</p>
                  </div>
                ) : (
                  products.map((product) => {
                    const isHovered = hoveredProductId === product.id;
                    const isSelected = selectedProduct?.id === product.id;
                    
                    return (
                      <div
                        key={product.id}
                        onClick={() => handleProductClick(product)}
                        onMouseEnter={() => setHoveredProductId(product.id)}
                        onMouseLeave={() => setHoveredProductId(null)}
                        className={`bg-white border rounded-3xl p-3.5 transition-all duration-200 cursor-pointer flex gap-4 ${
                          isSelected 
                            ? "border-emerald-500 ring-2 ring-emerald-500/10 shadow-md"
                            : isHovered 
                              ? "border-emerald-200 shadow-sm"
                              : "border-emerald-100/50"
                        }`}
                      >
                        {/* Thumbnail */}
                        <div className="w-20 h-20 bg-emerald-50 rounded-2xl overflow-hidden shrink-0 border border-emerald-100/30 flex items-center justify-center relative">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={product.images[0].imageUrl}
                              alt={product.productName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[10px] font-black text-emerald-700/40 uppercase">No Image</span>
                          )}
                          
                          {/* Distance Badge */}
                          <div className="absolute bottom-1 right-1 bg-emerald-950/80 backdrop-blur-sm px-1.5 py-0.5 rounded-md text-[9px] text-white font-bold font-mono">
                            {product.distance ? `${product.distance.toFixed(1)} km` : "Local"}
                          </div>
                        </div>

                        {/* Text Block */}
                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          <div>
                            <div className="flex justify-between items-start gap-1">
                              <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                {product.categoryName}
                              </span>
                              
                              {/* Rating display */}
                              {product.rating > 0 && (
                                <div className="flex items-center gap-0.5 text-amber-500 text-[10px] font-black">
                                  <Star size={10} className="fill-amber-500" />
                                  <span>{product.rating.toFixed(1)}</span>
                                </div>
                              )}
                            </div>
                            <h3 className="font-extrabold text-sm text-emerald-950 truncate mt-1">
                              {product.productName}
                            </h3>
                            <p className="text-[10px] text-emerald-900/60 font-semibold truncate">
                              Seller: {product.sellerName || "Local Farmer"}
                            </p>
                          </div>

                          <div className="flex justify-between items-end border-t border-emerald-50/50 pt-1.5 mt-1.5">
                            <span className="text-sm font-black text-emerald-600">
                              {formatPrice(product.price)}
                            </span>
                            <span className="text-[9px] text-emerald-800 font-black flex items-center gap-0.5 group">
                              Map Pin <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                            </span>
                          </div>
                        </div>

                      </div>
                    );
                  })
                )}
              </div>

            </div>

            {/* Map Area */}
            <div className="lg:col-span-8 h-[350px] lg:h-full bg-white rounded-3xl border border-emerald-100/50 overflow-hidden shadow-sm relative">
              {isLoaded ? (
                <GoogleMap
                  onLoad={handleMapLoad}
                  mapContainerStyle={{ width: "100%", height: "100%" }}
                  center={coords}
                  zoom={11}
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
                >
                  {/* User Center Coordinate marker */}
                  <Marker
                    position={coords}
                    title="Your location search center"
                    icon={{
                      url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                      scaledSize: new window.google.maps.Size(36, 36)
                    }}
                  />

                  {/* Products markers */}
                  {products.map((product) => {
                    if (!product.latitude || !product.longitude) return null;
                    const lat = Number(product.latitude);
                    const lng = Number(product.longitude);
                    const isSelected = selectedProduct?.id === product.id;
                    
                    return (
                      <Marker
                        key={product.id}
                        position={{ lat, lng }}
                        title={product.productName}
                        onClick={() => setSelectedProduct(product)}
                        animation={isSelected ? window.google?.maps?.Animation?.BOUNCE : null}
                        icon={{
                          url: isSelected
                            ? "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
                            : "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
                          scaledSize: new window.google.maps.Size(34, 34)
                        }}
                      />
                    );
                  })}

                  {/* Info Window */}
                  {selectedProduct && selectedProduct.latitude && selectedProduct.longitude && (
                    <InfoWindow
                      position={{
                        lat: Number(selectedProduct.latitude),
                        lng: Number(selectedProduct.longitude)
                      }}
                      onCloseClick={() => setSelectedProduct(null)}
                    >
                      <div className="p-2 max-w-xs space-y-2 font-outfit text-emerald-950">
                        <div className="flex gap-2">
                          {selectedProduct.images && selectedProduct.images.length > 0 && (
                            <img
                              src={selectedProduct.images[0].imageUrl}
                              alt={selectedProduct.productName}
                              className="w-12 h-12 rounded object-cover border"
                            />
                          )}
                          <div>
                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                              {selectedProduct.categoryName}
                            </span>
                            <h4 className="font-extrabold text-xs mt-1 leading-tight">{selectedProduct.productName}</h4>
                            <p className="text-[10px] text-gray-500 font-semibold">{selectedProduct.sellerName || "Farmer"}</p>
                          </div>
                        </div>
                        <div className="flex justify-between items-center border-t pt-1.5 text-xs">
                          <span className="font-black text-emerald-600">{formatPrice(selectedProduct.price)}</span>
                          <span className="font-bold font-mono text-[9px] bg-emerald-950 text-white px-1.5 py-0.5 rounded">
                            {selectedProduct.distance ? `${selectedProduct.distance.toFixed(1)} km away` : "Nearby"}
                          </span>
                        </div>
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-[#f0fdf4]/35 text-emerald-800 font-bold text-xs">
                  <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                  <span>Loading Map Engine...</span>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </MapProvider>
  );
}
