import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { Notificacion } from "../../types/_index";
import "../../styles/admin.scss";

interface DashboardStats {
  citasHoy: number;
  totalClientes: number;
  productosActivos: number;
  totalOrdenes: number;
}

const quickLinks = [
  { to: "/admin/calendar", label: "Ver Calendario", icon: "bi-calendar3" },
  { to: "/admin/services", label: "Gestionar Servicios", icon: "bi-tools" },
  { to: "/admin/orders", label: "Ver Órdenes", icon: "bi-receipt" },
  { to: "/admin/clients", label: "Ver Clientes", icon: "bi-people" },
];

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-PE", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const iconoTipo = (tipo: string) => {
  if (tipo.startsWith("pedido")) return "bi-receipt";
  if (tipo.startsWith("cita")) return "bi-calendar-event";
  return "bi-bell";
};

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [notifications, setNotifications] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, notifRes] = await Promise.all([
          api.get("/admin/dashboard"),
          api.get("/admin/dashboard/notifications"),
        ]);
        setStats(statsRes.data);
        setNotifications(notifRes.data || []);
      } catch {
        setError("Error al cargar datos del dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const marcarLeida = (id: number) => {
    api.post(`/admin/dashboard/notifications/${id}/read`).then(() => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
      );
    });
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <span className="spinner" />
        Cargando dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-content">
        <div className="admin-empty">
          <i className="bi bi-exclamation-triangle" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="admin-header">
        <div className="admin-header-title">
          <h1>Dashboard</h1>
          <p>Resumen general del sistema</p>
        </div>
      </div>

      <div className="admin-content">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon gold">
              <i className="bi bi-calendar-check" />
            </div>
            <div className="stat-number">{stats?.citasHoy ?? 0}</div>
            <div className="stat-label">Citas Hoy</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon cream">
              <i className="bi bi-people" />
            </div>
            <div className="stat-number">{stats?.totalClientes ?? 0}</div>
            <div className="stat-label">Clientes Registrados</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon mid">
              <i className="bi bi-box-seam" />
            </div>
            <div className="stat-number">{stats?.productosActivos ?? 0}</div>
            <div className="stat-label">Productos Activos</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon gold">
              <i className="bi bi-receipt" />
            </div>
            <div className="stat-number">{stats?.totalOrdenes ?? 0}</div>
            <div className="stat-label">Órdenes</div>
          </div>
        </div>

        <div className="admin-grid-2">
          <div className="admin-card">
            <div className="admin-card-header">
              <h2>Accesos Rápidos</h2>
            </div>
            <div className="admin-card-body">
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {quickLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="admin-btn admin-btn-outline"
                    style={{
                      justifyContent: "flex-start",
                      padding: "12px 16px",
                      textDecoration: "none",
                    }}
                  >
                    <i className={`bi ${link.icon}`} />
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-header">
              <h2>Notificaciones</h2>
              {notifications.some((n) => !n.leida) && (
                <span className="badge" style={{ background: "var(--gold)", color: "#fff" }}>
                  {notifications.filter((n) => !n.leida).length}
                </span>
              )}
            </div>
            <div className="admin-card-body">
              {notifications.length === 0 ? (
                <div className="admin-empty" style={{ padding: 24 }}>
                  <i className="bi bi-bell" style={{ fontSize: 28 }} />
                  <p>No hay notificaciones</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`notification-item${n.leida ? "" : " notification-item--unread"}`}
                    onClick={() => !n.leida && marcarLeida(n.id)}
                  >
                    <div className="notification-icon">
                      <i className={`bi ${iconoTipo(n.tipo)}`} />
                    </div>
                    <div className="notification-content">
                      <p className={`notification-message${n.leida ? "" : " notification-message--unread"}`}>
                        {n.mensaje}
                      </p>
                      <span className="notification-time">{formatDate(n.creadoEn)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
