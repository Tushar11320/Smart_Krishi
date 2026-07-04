import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  CloudSun,
  CloudSunRain,
  ShieldAlert,
  History,
  Leaf,
  Wheat,
  Milk,
  Boxes,
  Tractor,
  Hammer,
  MapPin,
  LayoutDashboard,
  ShoppingBag,
  ShoppingCart,
  FileText,
  Heart,
  Bell,
  Briefcase,
  Building,
  PlusCircle,
  Layers,
  FileCheck,
  IndianRupee,
  BarChart4,
  TrendingUp,
  LineChart,
  User,
  UserCircle,
  CreditCard,
  Settings,
  HelpCircle,
  LifeBuoy,
  Mail,
  FileQuestion,
  ChevronLeft,
  ChevronRight,
  Menu,
  Users,
  ShieldCheck,
  MessageSquare,
  X
} from "lucide-react";

export default function Sidebar({ isOpen, toggleSidebar, isCollapsed, setCollapsed, sidebarWidth, setSidebarWidth, isResizing, setIsResizing }) {
  const location = useLocation();
  const [expandedSection, setExpandedSection] = useState(null);
  const [user, setUser] = useState(null);

  // Esc key keyboard listener to close mobile menu
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, toggleSidebar]);

  const startResizing = (mouseDownEvent) => {
    mouseDownEvent.preventDefault();
    setIsResizing(true);
    const startWidth = sidebarWidth;
    const startX = mouseDownEvent.clientX;

    const doDrag = (mouseMoveEvent) => {
      const newWidth = startWidth + (mouseMoveEvent.clientX - startX);
      if (newWidth >= 240 && newWidth <= 380) {
        setSidebarWidth(newWidth);
        localStorage.setItem("sidebar_width", newWidth);
      }
    };

    const stopDrag = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", doDrag);
      document.removeEventListener("mouseup", stopDrag);
    };

    document.addEventListener("mousemove", doDrag);
    document.addEventListener("mouseup", stopDrag);
  };

  const handleResizeKeyDown = (e) => {
    let newWidth = sidebarWidth;
    if (e.key === "ArrowLeft") {
      newWidth = Math.max(240, sidebarWidth - 10);
    } else if (e.key === "ArrowRight") {
      newWidth = Math.min(380, sidebarWidth + 10);
    } else {
      return;
    }
    e.preventDefault();
    setSidebarWidth(newWidth);
    localStorage.setItem("sidebar_width", newWidth);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user in sidebar", e);
      }
    } else {
      setUser(null);
    }
  }, [location]);

  const isAdmin = user && (user.roles?.includes("ADMIN") || user.roles?.includes("ROLE_ADMIN") || user.roles?.includes("SUPER_ADMIN"));
  const isSeller = user && (user.roles?.includes("SELLER") || user.roles?.includes("ROLE_SELLER"));

  // Theme Category Colors mapping
  const categoryColors = {
    agriculture: {
      text: "text-emerald-400",
      bg: "bg-emerald-950/60",
      border: "border-brand-green-mid",
      hover: "hover:bg-emerald-900/30 hover:text-emerald-300"
    },
    weather: {
      text: "text-sky-400",
      bg: "bg-sky-950/60",
      border: "border-sky-blue",
      hover: "hover:bg-sky-900/30 hover:text-sky-300"
    },
    orders: {
      text: "text-orange-400",
      bg: "bg-orange-950/60",
      border: "border-orange-500",
      hover: "hover:bg-orange-900/30 hover:text-orange-300"
    },
    earnings: {
      text: "text-wheat-gold",
      bg: "bg-wheat-gold/15",
      border: "border-wheat-gold",
      hover: "hover:bg-wheat-gold/10 hover:text-wheat-gold"
    },
    default: {
      text: "text-green-400",
      bg: "bg-green-900/40",
      border: "border-brand-green-light",
      hover: "hover:bg-green-900/20 hover:text-green-300"
    }
  };

  const navSchema = [];

  if (isAdmin) {
    navSchema.push(
      {
        title: "Admin Dashboard",
        type: "link",
        path: "/admin/dashboard",
        icon: LayoutDashboard,
        color: "default"
      },
      {
        title: "User Management",
        type: "link",
        path: "/admin/users",
        icon: Users,
        color: "default"
      },
      {
        title: "Seller Verification",
        type: "link",
        path: "/admin/verification",
        icon: ShieldCheck,
        color: "default"
      },
      {
        title: "Product Moderation",
        type: "link",
        path: "/admin/moderation",
        icon: Leaf,
        color: "default"
      },
      {
        title: "Revenue Analytics",
        type: "link",
        path: "/admin/revenue",
        icon: IndianRupee,
        color: "default"
      },
      {
        title: "Platform Analytics",
        type: "link",
        path: "/admin/platform-analytics",
        icon: BarChart4,
        color: "default"
      },
      {
        title: "Order Management",
        type: "link",
        path: "/admin/orders",
        icon: FileText,
        color: "default"
      },
      {
        title: "Fraud Monitoring",
        type: "link",
        path: "/admin/fraud",
        icon: ShieldAlert,
        color: "default"
      },
      {
        title: "System Settings",
        type: "link",
        path: "/admin/settings",
        icon: Settings,
        color: "default"
      },
      {
        title: "User Feedback",
        type: "link",
        path: "/admin/feedback",
        icon: MessageSquare,
        color: "default"
      },
      {
        title: "Account",
        type: "accordion",
        id: "account",
        icon: User,
        color: "default",
        subItems: [
          { title: "Profile", path: "/account", icon: UserCircle },
          { title: "Settings", path: "/account/settings", icon: Settings }
        ]
      }
    );
  } else {
    // Buyer / Seller view
    navSchema.push(
      {
        title: "Marketplace Hub",
        type: "link",
        path: "/",
        icon: Home,
        color: "default"
      },
      {
        title: "System Dashboard",
        type: "link",
        path: "/dashboard",
        icon: BarChart4,
        color: "default"
      },
      {
        title: "Weather Intelligence",
        type: "accordion",
        id: "weather",
        icon: CloudSun,
        color: "weather",
        subItems: [
          { title: "Current Weather", path: "/weather", icon: CloudSun },
          { title: "Forecast", path: "/weather/forecast", icon: CloudSunRain },
          { title: "Farmer Advisories", path: "/weather/advisories", icon: ShieldAlert }
        ]
      },
      {
        title: "Agriculture Marketplace",
        type: "accordion",
        id: "marketplace",
        icon: Leaf,
        color: "agriculture",
        subItems: [
          { title: "Crops Marketplace", path: "/farming-crop", icon: Wheat },
          { title: "Milk Marketplace", path: "/milk", icon: Milk },
          { title: "Fertilizer Marketplace", path: "/fertilizers", icon: Boxes },
          { title: "Machinery Marketplace", path: "/machinery", icon: Tractor },
          { title: "Machinery Rentals", path: "/machinery-rental", icon: Tractor },
          { title: "Building Materials", path: "/building-materials", icon: Hammer },
          { title: "Land Marketplace", path: "/landselling", icon: MapPin }
        ]
      },
      {
        title: "Buyer Center",
        type: "accordion",
        id: "buyer",
        icon: ShoppingBag,
        color: "orders",
        subItems: [
          { title: "My Cart", path: "/cart", icon: ShoppingCart },
          { title: "My Orders", path: "/account/orders", icon: FileText },
          { title: "Wishlist", path: "/account/wishlist", icon: Heart },
          { title: "Notifications", path: "/account/notifications", icon: Bell },
          { title: "Nearby Listings", path: "/nearby-products", icon: MapPin }
        ]
      }
    );

    if (isSeller) {
      navSchema.push({
        title: "Seller Center",
        type: "accordion",
        id: "seller",
        icon: Briefcase,
        color: "earnings",
        subItems: [
          { title: "My Shop", path: "/account/seller-application/shop", icon: Building },
          { title: "Add Product", path: "/account/seller-application/add-product", icon: PlusCircle },
          { title: "My Listings", path: "/account/seller-application/listings", icon: Layers },
          { title: "Inventory", path: "/account/seller-application/inventory", icon: Boxes },
          { title: "Orders Received", path: "/account/seller-application/orders", icon: FileCheck },
          { title: "Earnings", path: "/account/seller-application/earnings", icon: IndianRupee },
          { title: "Analytics", path: "/account/seller-application/analytics", icon: BarChart4 },
          { title: "Shop Location Setup", path: "/seller/location-setup", icon: MapPin }
        ]
      });
    }

    navSchema.push(
      {
        title: "Account",
        type: "accordion",
        id: "account",
        icon: User,
        color: "default",
        subItems: [
          { title: "Profile", path: "/account/profile", icon: UserCircle },
          { title: "Address Book", path: "/account/addresses", icon: MapPin },
          { title: "Payment Methods", path: "/account/payments", icon: CreditCard },
          { title: "Settings", path: "/account/settings", icon: Settings }
        ]
      },
      {
        title: "Support",
        type: "accordion",
        id: "support",
        icon: HelpCircle,
        color: "default",
        subItems: [
          { title: "Help Center", path: "/support/help", icon: LifeBuoy },
          { title: "Contact Support", path: "/support/contact", icon: Mail },
          { title: "FAQ", path: "/support/faq", icon: FileQuestion }
        ]
      }
    );
  }

  const handleAccordionClick = (id) => {
    if (isCollapsed) {
      setCollapsed(false);
      setExpandedSection(id);
    } else {
      setExpandedSection(expandedSection === id ? null : id);
    }
  };

  const isItemActive = (path) => location.pathname === path;
  const isSectionActive = (subItems) => subItems.some(item => location.pathname === item.path);

  // Render navigation item element
  const renderItem = (item) => {
    const Icon = item.icon;
    const colors = categoryColors[item.color] || categoryColors.default;

    if (item.type === "link") {
      const active = isItemActive(item.path);
      return (
        <Link
          key={item.path}
          to={item.path}
          className={`flex items-center gap-3.5 px-4 py-3 rounded-xl font-bold transition-all duration-200 border-l-4 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-green-950 ${
            active
              ? `${colors.text} ${colors.bg} ${colors.border}`
              : "border-transparent text-gray-400 hover:text-white hover:bg-white/5"
          }`}
          onClick={() => isOpen && toggleSidebar()}
          title={isCollapsed && !isOpen ? item.title : ""}
          aria-label={item.title}
        >
          <Icon size={20} className={active ? colors.text : "text-gray-400"} aria-hidden="true" />
          <span className={`text-sm tracking-wide ${isCollapsed && !isOpen ? "sr-only" : ""}`}>{item.title}</span>
        </Link>
      );
    }

    if (item.type === "accordion") {
      const open = expandedSection === item.id;
      const active = isSectionActive(item.subItems);

      return (
        <div key={item.id} className="space-y-1">
          <button
            onClick={() => handleAccordionClick(item.id)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all duration-200 border-l-4 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-green-950 ${
              active
                ? `${colors.text} ${colors.bg} ${colors.border}`
                : "border-transparent text-gray-400 hover:text-white hover:bg-white/5"
            }`}
            title={isCollapsed && !isOpen ? item.title : ""}
            aria-expanded={open}
            aria-controls={`subitems-${item.id}`}
            aria-label={item.title}
          >
            <div className="flex items-center gap-3.5">
              <Icon size={20} className={active || open ? colors.text : "text-gray-400"} aria-hidden="true" />
              <span className={`text-sm tracking-wide ${isCollapsed && !isOpen ? "sr-only" : ""}`}>{item.title}</span>
            </div>
            {!isCollapsed && (
              <ChevronLeft
                size={16}
                className={`transition-transform duration-250 ${open ? "-rotate-90 text-white" : "text-gray-500"}`}
                aria-hidden="true"
              />
            )}
          </button>

          <AnimatePresence initial={false}>
            {open && !isCollapsed && (
              <motion.div
                id={`subitems-${item.id}`}
                role="region"
                aria-label={`${item.title} sub menu`}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="overflow-hidden pl-7 space-y-1 pr-1"
              >
                {item.subItems.map((sub) => {
                  const SubIcon = sub.icon;
                  const subActive = isItemActive(sub.path);
                  return (
                    <Link
                      key={sub.path}
                      to={sub.path}
                      className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                        subActive
                          ? `${colors.text} bg-white/5`
                          : "text-gray-400 hover:text-white hover:bg-white/5"
                      }`}
                      onClick={() => isOpen && toggleSidebar()}
                      aria-label={sub.title}
                    >
                      <div className="flex items-center gap-2.5">
                        <SubIcon size={14} className={subActive ? colors.text : "text-gray-500"} aria-hidden="true" />
                        <span>{sub.title}</span>
                      </div>
                      {sub.badge && (
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                          item.color === "orders" ? "bg-orange-500 text-white" :
                          item.color === "earnings" ? "bg-amber-500 text-black" :
                          "bg-green-600 text-white"
                        }`}>
                          {sub.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      {/* Mobile Sidebar overlay background backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Main Sidebar Wrapper */}
      <aside
        role={isOpen ? "dialog" : "navigation"}
        aria-modal={isOpen ? "true" : undefined}
        aria-label={isOpen ? "Sidebar Navigation Drawer" : "Sidebar Navigation"}
        style={{
          width: isOpen ? "288px" : (isCollapsed ? "80px" : `${sidebarWidth}px`)
        }}
        className={`fixed top-0 bottom-0 left-0 bg-gradient-to-b from-green-950 via-[#052e16] to-[#021c0d] border-r border-green-900/35 text-white flex flex-col z-50 shadow-2xl ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${isResizing ? "" : "transition-[width,transform] duration-300"}`}
      >
        {/* Resize Handle for Desktop */}
        {!isCollapsed && (
          <div
            onMouseDown={startResizing}
            onKeyDown={handleResizeKeyDown}
            tabIndex={0}
            role="separator"
            aria-valuenow={sidebarWidth}
            aria-valuemin={240}
            aria-valuemax={380}
            aria-label="Sidebar resize handle"
            className="hidden lg:block absolute top-0 right-0 bottom-0 w-2 cursor-col-resize hover:bg-emerald-500/50 active:bg-emerald-600 focus-visible:bg-emerald-500/70 focus-visible:outline-none transition-colors z-50"
          />
        )}

        {/* Brand logo header */}
        <div 
          className={`h-16 flex items-center justify-between border-b border-green-900/20 ${isCollapsed ? "px-4 justify-center" : "px-6"}`}
          onClick={() => isCollapsed && setCollapsed(false)}
          style={{ cursor: isCollapsed ? "pointer" : "default" }}
        >
          <Link to="/" className="flex items-center gap-2.5 overflow-hidden">
            <Leaf className="text-emerald-500 flex-shrink-0" size={26} />
            {(!isCollapsed || isOpen) && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="font-black text-lg tracking-wider bg-gradient-to-r from-white via-green-100 to-emerald-400 bg-clip-text text-transparent"
              >
                Smart Krishi
              </motion.span>
            )}
          </Link>

          {/* Desktop header toggle button next to logo */}
          {(!isCollapsed || isOpen) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCollapsed(true);
              }}
              className="hidden lg:flex w-8 h-8 bg-white/10 hover:bg-white/20 text-white rounded-full items-center justify-center cursor-pointer transition shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              title="Collapse Sidebar"
              aria-label="Collapse Sidebar"
            >
              <Menu size={16} aria-hidden="true" />
            </button>
          )}

          <button
            className="lg:hidden text-gray-400 hover:text-white outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            onClick={toggleSidebar}
            aria-label="Close Sidebar Drawer"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable list items navigation content */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin scrollbar-thumb-white/5">
          {navSchema.map((item) => renderItem(item))}
        </nav>

        {/* Sidebar Settings Collapse Toggle at bottom */}
        <div className="p-4 border-t border-green-900/25 space-y-2">
          {(!isCollapsed || isOpen) && (
            <span className="text-[9px] uppercase tracking-widest text-gray-500 font-black block px-2" aria-hidden="true">
              Sidebar Settings
            </span>
          )}
          <button
            onClick={() => setCollapsed(!isCollapsed)}
            className={`w-full flex items-center justify-between p-2.5 hover:bg-white/5 rounded-xl transition text-left text-gray-400 hover:text-white font-bold text-xs outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-green-950 ${
              isCollapsed ? "justify-center" : "px-2"
            }`}
            aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            aria-expanded={!isCollapsed}
          >
            <div className="flex items-center gap-3">
              <Menu size={16} aria-hidden="true" />
              {(!isCollapsed || isOpen) && <span>Collapse Sidebar</span>}
            </div>
            {(!isCollapsed || isOpen) && (
              <div className="p-1 bg-white/5 rounded-lg text-gray-400 hover:bg-white/10 transition" aria-hidden="true">
                <ChevronLeft size={14} className={`transform transition-transform ${isCollapsed ? "rotate-180" : ""}`} />
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}