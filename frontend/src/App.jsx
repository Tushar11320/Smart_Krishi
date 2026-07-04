import React, { useState, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

const ProfileSection = React.lazy(() => import("./Pages/account/ProfileSection"));
const SellerApplication = React.lazy(() => import("./Pages/account/SellerApplication"));
const OrdersHistory = React.lazy(() => import("./Pages/account/OrdersHistory"));
const MachineryRentals = React.lazy(() => import("./Pages/account/MachineryRentals"));
const MyReviews = React.lazy(() => import("./Pages/account/MyReviews"));
const Wishlist = React.lazy(() => import("./Pages/account/Wishlist"));
const Notifications = React.lazy(() => import("./Pages/account/Notifications"));
const AddressBook = React.lazy(() => import("./Pages/account/AddressBook"));

import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import { MapProvider } from "./components/MapProvider";
import BottomNavigation from "./components/BottomNavigation";
import { useEffect } from "react";
import { X, Download, WifiOff } from "lucide-react";

import Home from "./Pages/Home";
import Machinery from "./Pages/Machinery";
import Milk from "./Pages/Milk";
import Fertilizer from "./Pages/Fertilizers";
import FarmingEquipment from "./Pages/FarmingEquipment";
import Landselling from "./Pages/Landselling";
import Weather from "./Pages/Weather";
import FarmingCrop from "./Pages/FarmingCrop";
import TopDeals from "./Pages/TopDeals";
import Account from "./Pages/Account";
import Dashboard from "./Pages/Dashboard";
import Play from "./Pages/Play";
import NotFound from "./Pages/NotFound";
import BuildingMaterials from "./Pages/BuildingMaterials";
import Cart from "./Pages/Cart";
import Checkout from "./Pages/Checkout";
import WaterSupply from "./Pages/WaterSupply";
import OrderTracking from "./Pages/OrderTracking";
import NearbyProducts from "./Pages/NearbyProducts";
import SellerLocationSetup from "./Pages/SellerLocationSetup";

import {
  AdminUserManagement,
  AdminSellerVerification,
  AdminProductModeration,
  AdminRevenueAnalytics,
  AdminPlatformAnalytics,
  AdminOrderManagement,
  AdminFraudMonitoring,
  AdminSystemSettings,
  AdminFeedbackManagement
} from "./Pages/AdminPages";
import AdminDashboardOverview from "./components/AdminDashboardOverview";

// Placeholder sub-pages for new sidebar sections
import {
  WeatherForecast,
  FarmerAdvisories,
  SalesReports,
  MarketTrends,
  WeatherReports,
  PaymentMethods,
  AppSettings,
  HelpCenter,
  ContactSupport,
  FaqPage
} from "./Pages/PlaceholderPages";

function App() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCollapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    return saved === "true";
  });

  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem("sidebar_width");
    return saved ? parseInt(saved, 10) : 288;
  });

  const [isResizing, setIsResizing] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOnlineToast, setShowOnlineToast] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOnlineToast(true);
      setTimeout(() => setShowOnlineToast(false), 4000);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => {
        if (!sessionStorage.getItem("pwa_banner_dismissed")) {
          setShowInstallBanner(true);
        }
      }, 5000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA installation outcome: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  const handleDismissInstall = () => {
    setShowInstallBanner(false);
    sessionStorage.setItem("pwa_banner_dismissed", "true");
  };

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
      if (width >= 768 && width <= 1024) {
        setCollapsed(true);
      } else if (width > 1024) {
        const saved = localStorage.getItem("sidebar_collapsed");
        setCollapsed(saved === "true");
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSetCollapsed = (val) => {
    setCollapsed(val);
    localStorage.setItem("sidebar_collapsed", val);
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  let paddingLeft = "0px";
  if (windowWidth >= 1024) {
    paddingLeft = isCollapsed ? "80px" : `${sidebarWidth}px`;
  } else if (windowWidth >= 768) {
    paddingLeft = "80px";
  }

  return (
    <MapProvider>
      <div className="flex min-h-screen bg-gray-50/50">
      <Sidebar
        isOpen={isMobileSidebarOpen}
        toggleSidebar={toggleMobileSidebar}
        isCollapsed={isCollapsed}
        setCollapsed={handleSetCollapsed}
        sidebarWidth={sidebarWidth}
        setSidebarWidth={setSidebarWidth}
        isResizing={isResizing}
        setIsResizing={setIsResizing}
      />

      <div
        style={{
          paddingLeft: paddingLeft
        }}
        className={`flex-grow flex flex-col min-h-screen ${isResizing ? "" : "transition-[padding-left] duration-300"}`}
      >
        {!isOnline && (
          <div className="bg-red-600 text-white text-xs font-semibold py-2.5 px-4 text-center flex items-center justify-center gap-2 z-50 animate-slide-down">
            <WifiOff size={14} className="animate-pulse" />
            <span>You are currently offline. Pages will load from cache when available.</span>
          </div>
        )}
        <Topbar toggleMobileSidebar={toggleMobileSidebar} />

        <main className="flex-grow">
          <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[50vh] font-outfit">
              <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-emerald-950 font-black text-xs">Synchronizing portal intelligence...</p>
            </div>
          }>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/machinery" element={<Machinery />} />
              <Route path="/machinery-rental" element={<Machinery />} />
              <Route path="/milk" element={<Milk />} />
              <Route path="/fertilizers" element={<Fertilizer />} />
              <Route path="/farming-equipment" element={<FarmingEquipment />} />
              <Route path="/landselling" element={<Landselling />} />
              <Route path="/weather" element={<Weather />} />
              <Route path="/farming-crop" element={<FarmingCrop />} />
              <Route path="/top-deals" element={<TopDeals />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={["BUYER", "SELLER", "ADMIN"]}>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Account Profile and sub-routes */}
              <Route 
                path="/account" 
                element={<Account />}
              >
                <Route index element={<Navigate to="profile" replace />} />
                <Route path="profile" element={<ProfileSection />} />
                <Route path="seller-application" element={<SellerApplication />} />
                <Route path="seller-application/shop" element={<SellerApplication />} />
                <Route path="seller-application/add-product" element={<SellerApplication />} />
                <Route path="seller-application/listings" element={<SellerApplication />} />
                <Route path="seller-application/land-listings" element={<SellerApplication />} />
                <Route path="seller-application/inventory" element={<SellerApplication />} />
                <Route path="seller-application/orders" element={<SellerApplication />} />
                <Route path="seller-application/earnings" element={<SellerApplication />} />
                <Route path="seller-application/analytics" element={<SellerApplication />} />
                <Route path="orders" element={<OrdersHistory />} />
                <Route path="rentals" element={<MachineryRentals />} />
                <Route path="reviews" element={<MyReviews />} />
                <Route path="wishlist" element={<Wishlist />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="addresses" element={<AddressBook />} />
                <Route path="payments" element={<PaymentMethods />} />
                <Route path="settings" element={<AppSettings />} />
              </Route>

              {/* Buyer Center routes redirects for backward compatibility */}
              <Route path="/buyer/orders" element={<Navigate to="/account/orders" replace />} />
              <Route path="/buyer/rentals" element={<Navigate to="/account/rentals" replace />} />
              <Route path="/buyer/reviews" element={<Navigate to="/account/reviews" replace />} />
              <Route path="/buyer/wishlist" element={<Navigate to="/account/wishlist" replace />} />
              <Route path="/buyer/notifications" element={<Navigate to="/account/notifications" replace />} />

              {/* Seller Center routes redirects for backward compatibility */}
              <Route path="/seller/shop" element={<Navigate to="/account/seller-application/shop" replace />} />
              <Route path="/seller/add-product" element={<Navigate to="/account/seller-application/add-product" replace />} />
              <Route path="/seller/listings" element={<Navigate to="/account/seller-application/listings" replace />} />
              <Route path="/seller/inventory" element={<Navigate to="/account/seller-application/inventory" replace />} />
              <Route path="/seller/orders" element={<Navigate to="/account/seller-application/orders" replace />} />
              <Route path="/seller/earnings" element={<Navigate to="/account/seller-application/earnings" replace />} />
              <Route path="/seller/dashboard" element={<Navigate to="/account/seller-application" replace />} />
              <Route path="/seller/analytics" element={<Navigate to="/account/seller-application/analytics" replace />} />

              {/* Admin Console routes */}
              <Route 
                path="/admin/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={["ADMIN"]}>
                    <AdminDashboardOverview />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/users" 
                element={
                  <ProtectedRoute allowedRoles={["ADMIN"]}>
                    <AdminUserManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/verification" 
                element={
                  <ProtectedRoute allowedRoles={["ADMIN"]}>
                    <AdminSellerVerification />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/moderation" 
                element={
                  <ProtectedRoute allowedRoles={["ADMIN"]}>
                    <AdminProductModeration />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/revenue" 
                element={
                  <ProtectedRoute allowedRoles={["ADMIN"]}>
                    <AdminRevenueAnalytics />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/platform-analytics" 
                element={
                  <ProtectedRoute allowedRoles={["ADMIN"]}>
                    <AdminPlatformAnalytics />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/orders" 
                element={
                  <ProtectedRoute allowedRoles={["ADMIN"]}>
                    <AdminOrderManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/fraud" 
                element={
                  <ProtectedRoute allowedRoles={["ADMIN"]}>
                    <AdminFraudMonitoring />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/settings" 
                element={
                  <ProtectedRoute allowedRoles={["ADMIN"]}>
                    <AdminSystemSettings />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/feedback" 
                element={
                  <ProtectedRoute allowedRoles={["ADMIN"]}>
                    <AdminFeedbackManagement />
                  </ProtectedRoute>
                } 
              />

              {/* Weather sub-routes */}
              <Route path="/weather/forecast" element={<WeatherForecast />} />
              <Route path="/weather/advisories" element={<FarmerAdvisories />} />

              {/* Reports */}
              <Route path="/reports/sales" element={<SalesReports />} />
              <Route path="/reports/trends" element={<MarketTrends />} />
              <Route path="/reports/weather" element={<WeatherReports />} />

              {/* Support */}
              <Route path="/support/help" element={<HelpCenter />} />
              <Route path="/support/contact" element={<ContactSupport />} />
              <Route path="/support/faq" element={<FaqPage />} />

              <Route path="/play" element={<Play />} />
              <Route path="/building-materials" element={<BuildingMaterials />} />
              <Route path="/water-supply" element={<WaterSupply />} />
              <Route path="/orders/:orderId/track" element={<OrderTracking />} />
              
              {/* Geolocation routes */}
              <Route path="/nearby-products" element={<NearbyProducts />} />
              <Route 
                path="/seller/location-setup" 
                element={
                  <ProtectedRoute allowedRoles={["SELLER", "ADMIN"]}>
                    <SellerLocationSetup />
                  </ProtectedRoute>
                } 
              />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>

        <Footer />
      </div>
      <BottomNavigation />

      {showInstallBanner && (
        <div className="fixed bottom-24 left-4 right-4 md:bottom-6 md:right-6 md:left-auto md:w-96 z-50 bg-white/95 backdrop-blur-md border border-green-900/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl p-4 flex flex-col gap-3 animate-fade-in font-outfit">
          <div className="flex items-start justify-between">
            <div className="flex gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0 border border-emerald-100">
                <img src="/icons/icon-192x192.png" alt="Smart Krishi" className="w-9 h-9 rounded-lg" onError={(e) => {
                  e.target.style.display = 'none';
                }} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">Install Smart Krishi</h4>
                <p className="text-xs text-gray-500 mt-0.5">Add to your home screen for offline access and native experience.</p>
              </div>
            </div>
            <button 
              onClick={handleDismissInstall}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleDismissInstall}
              className="flex-1 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all"
            >
              Later
            </button>
            <button 
              onClick={handleInstallClick}
              className="flex-1 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm hover:shadow shadow-emerald-600/10 flex items-center justify-center gap-1.5 transition-all"
            >
              <Download size={14} />
              Install App
            </button>
          </div>
        </div>
      )}

      {showOnlineToast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-emerald-600 text-white text-xs font-semibold py-2.5 px-5 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
          <div className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
          <span>Back online. Sync complete!</span>
        </div>
      )}
    </div>
  </MapProvider>
  );
}

export default App;