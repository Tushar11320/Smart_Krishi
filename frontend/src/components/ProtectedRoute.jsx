import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRoles }) {
  const userStr = localStorage.getItem("user");
  const token = localStorage.getItem("token");

  // If not logged in, redirect to auth account page
  if (!userStr || !token) {
    return <Navigate to="/account" replace />;
  }

  try {
    const user = JSON.parse(userStr);
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
