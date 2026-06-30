import React from "react";
import Footer from "../components/layouts/Footer";
import Navbar from "../components/layouts/Navbar";
import { Outlet, useLocation } from "react-router-dom";

export const MainLayout = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  return (
    <div>
      {!isAdmin && <Navbar />}
      <Outlet />
      {!isAdmin && <Footer />}
    </div>
  );
};

export default MainLayout;
