import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const AdminAuthGuard: React.FC = () => {
  const { isAuthenticated, userRole } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  if (userRole !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default AdminAuthGuard;
