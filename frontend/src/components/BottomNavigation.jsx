import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Wheat, CloudSun, ShoppingCart, User } from "lucide-react";
import api from "../services/api";

export default function BottomNavigation() {
  const location = useLocation();
  const [cartCount, setCartCount] = useState(0);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user in bottom nav", e);
      }
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!user?.id) {
      setCartCount(0);
      return;
    }

    const fetchCartCount = async () => {
      try {
        const res = await api.get(`/cart/${user.id}`);
        const cartData = res.data?.data || res.data;
        const items = cartData.cartItems || [];
        const activeItems = items.filter(item => !item.saveForLater);
        // sum quantities
        const total = activeItems.reduce((acc, item) => acc + item.quantity, 0);
        setCartCount(total);
      } catch (err) {
        console.error("Failed to fetch cart count in bottom nav:", err);
      }
    };

    fetchCartCount();
  }, [user?.id, location.pathname]);

  const navItems = [
    { label: "Home", path: "/", icon: Home },
    { label: "Crops", path: "/farming-crop", icon: Wheat },
    { label: "Weather", path: "/weather", icon: CloudSun },
    { label: "Cart", path: "/cart", icon: ShoppingCart, badge: cartCount },
    { label: "Profile", path: "/account/profile", icon: User }
  ];

  const isTabActive = (item) => {
    if (item.path === "/") {
      return location.pathname === "/" || location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(item.path);
  };

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-40 lg:hidden backdrop-blur-lg bg-white/90 border border-green-900/10 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-[24px] px-2 py-2">
      <div className="flex items-center justify-around">
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          const active = isTabActive(item);
          return (
            <Link
              key={idx}
              to={item.path}
              className="relative flex flex-col items-center justify-center py-2 px-3 min-h-[44px] transition-all duration-200 group"
            >
              <div
                className={`p-2 rounded-xl transition-all duration-300 flex items-center justify-center ${
                  active
                    ? "bg-emerald-600 text-white scale-110 shadow-md shadow-emerald-600/20"
                    : "text-gray-400 group-hover:text-emerald-700 hover:bg-emerald-50/50"
                }`}
              >
                <Icon size={20} className="transition-transform duration-200 active:scale-90" />
              </div>
              
              {/* Badge for counts */}
              {item.badge > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-4.5 h-4.5 bg-orange-500 text-white rounded-full text-[9px] font-black flex items-center justify-center border border-white px-1">
                  {item.badge}
                </span>
              )}
              
              <span
                className={`text-[9px] font-black mt-1 uppercase tracking-wider transition-all duration-200 ${
                  active ? "text-emerald-950 font-black scale-100" : "text-gray-400 opacity-80"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
