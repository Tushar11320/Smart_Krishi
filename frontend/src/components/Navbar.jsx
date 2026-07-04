import React from "react";
import { Link } from "react-router-dom";
import {
  Home,
  Tractor,
  LandPlot,
  Wheat,
  Milk,
  Hammer,
  CloudSun,
  ShoppingCart,
  User,
  Leaf
} from "lucide-react";

function Navbar() {
  return (
    <nav className="bg-green-600 text-white px-6 py-3 shadow-md">
      <div className="flex justify-between items-center">

        <h1 className="text-xl font-bold">
          <Link to="/" className="flex items-center gap-2">
            <Tractor size={22} />
            Jay Kishan
          </Link>
        </h1>

        <ul className="flex space-x-6 items-center text-sm font-medium">

          <li><Link to="/">Home</Link></li>

          <li><Link to="/machinery">Machinery</Link></li>

          <li><Link to="/farming-equipment">Farming Equipment</Link></li>

          <li><Link to="/landselling">Land</Link></li>

          <li><Link to="/fertilizers">Fertilizers</Link></li>

          <li><Link to="/farming-crop">Crops</Link></li>

          <li><Link to="/milk">Milk</Link></li>

          <li><Link to="/building-materials">Building Materials</Link></li>

          <li><Link to="/weather">Weather</Link></li>

          <li><Link to="/cart">Cart</Link></li>

          <li><Link to="/account">Account</Link></li>

        </ul>
      </div>
    </nav>
  );
}

export default Navbar;