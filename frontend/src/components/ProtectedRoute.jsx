import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] font-outfit">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-emerald-950 font-black text-xs">Verifying authorization credentials...</p>
      </div>
    );
  }

  // If not logged in, redirect to auth account page
  if (!user || !token) {
    return <Navigate to="/account" replace />;
  }

  try {
    const roles = user.roles || [];

    const hasAccess = allowedRoles.some(role => {
      const normalizedRole = role === "BUYER" ? "USER" : role;
      return roles.includes(normalizedRole) || roles.includes(`ROLE_${normalizedRole}`) || roles.includes(role) || roles.includes(`ROLE_${role}`);
    });

    if (!hasAccess) {
      console.warn(`[Route Guard] Unauthorized access attempt by user: ${user.email}. Allowed roles: ${allowedRoles}`);
      // Redirect to home or standard dashboard depending on user profile
      const isAdmin = roles.includes("ADMIN") || roles.includes("ROLE_ADMIN") || roles.includes("SUPER_ADMIN");
      return <Navigate to={isAdmin ? "/dashboard" : "/"} replace />;
    }

    return children;
  } catch (err) {
    console.error("[Route Guard] Error parsing user details", err);
    return <Navigate to="/account" replace />;
  }
}
