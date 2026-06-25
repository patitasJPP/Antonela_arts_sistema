import React, { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "../../styles/admin.scss";

const navItems = [
  {
    section: "Principal",
    items: [
      { to: "/admin", label: "Dashboard", icon: "bi-speedometer2" },
      { to: "/admin/calendar", label: "Calendario", icon: "bi-calendar3" },
    ],
  },
  {
    section: "Gestión",
    items: [
      { to: "/admin/services", label: "Servicios", icon: "bi-tools" },
      { to: "/admin/inventory", label: "Inventario", icon: "bi-box-seam" },
      { to: "/admin/gallery", label: "Galería", icon: "bi-images" },
    ],
  },
  {
    section: "Clientes",
    items: [
      { to: "/admin/orders", label: "Órdenes", icon: "bi-receipt" },
      { to: "/admin/clients", label: "Clientes", icon: "bi-people" },
    ],
  },
  {
    section: "Sistema",
    items: [
      { to: "/admin/tasks", label: "Tareas", icon: "bi-check2-square" },
    ],
  },
];

const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { usuarioAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const closeSidebar = () => setSidebarOpen(false);

  const displayName = usuarioAdmin?.nombreUsuario || "Administrador";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="admin-layout">
      <button
        className="admin-sidebar-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle sidebar"
      >
        <i className={`bi ${sidebarOpen ? "bi-x-lg" : "bi-list"}`} />
      </button>

      <div
        className={`admin-sidebar-overlay ${sidebarOpen ? "visible" : ""}`}
        onClick={closeSidebar}
      />

      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="admin-sidebar-header">
          <Link to="/admin" className="admin-logo" onClick={closeSidebar}>
            <i className="bi bi-gem" />
            Antonela <span>Admin</span>
          </Link>
        </div>

        <nav className="admin-sidebar-nav">
          {navItems.map((group) => (
            <div key={group.section}>
              <div className="admin-nav-section">{group.section}</div>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/admin"}
                  className={({ isActive }) =>
                    `admin-nav-link${isActive ? " active" : ""}`
                  }
                  onClick={closeSidebar}
                >
                  <i className={`bi ${item.icon}`} />
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-info">
            <div className="admin-user-avatar">{initial}</div>
            <div>
              <div className="admin-user-name">{displayName}</div>
              <div className="admin-user-role">Administrador</div>
            </div>
          </div>
          <button className="admin-logout-btn" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
