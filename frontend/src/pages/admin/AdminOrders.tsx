import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { OrdenCompra } from "../../types/_index";
import "../../styles/admin.scss";

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<OrdenCompra[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = async () => {
    try {
      const res = await api.get("/admin/orders");
      setOrders(res.data);
    } catch {
      setError("Error al cargar órdenes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await api.put(`/admin/orders/${id}/status`, { estado: newStatus });
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, estado: newStatus } : o)),
      );
    } catch {
      setError("Error al actualizar estado");
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <span className="spinner" />
        Cargando órdenes...
      </div>
    );
  }

  return (
    <>
      <div className="admin-header">
        <div className="admin-header-title">
          <h1>Órdenes</h1>
          <p>{orders.length} órdenes registradas</p>
        </div>
        <div className="admin-header-actions">
          <button className="admin-btn admin-btn-gold" onClick={fetchOrders}>
            <i className="bi bi-arrow-clockwise" />
            Actualizar
          </button>
        </div>
      </div>

      <div className="admin-content">
        {error && (
          <div
            style={{
              background: "rgba(220,53,69,0.08)",
              color: "#dc3545",
              padding: "12px 16px",
              borderRadius: 10,
              marginBottom: 16,
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        <div className="admin-card">
          <div className="admin-card-body" style={{ padding: 0 }}>
            {orders.length === 0 ? (
              <div className="admin-empty">
                <i className="bi bi-receipt" />
                <p>No hay órdenes registradas</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Cliente</th>
                      <th>Productos</th>
                      <th>Total</th>
                      <th>Método</th>
                      <th>Estado</th>
                      <th>Fecha</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => {
                      let productosText = "-";
                      try {
                        const parsed =
                          typeof order.productos === "string"
                            ? JSON.parse(order.productos)
                            : order.productos;
                        productosText = Array.isArray(parsed)
                          ? parsed
                              .map((p: { nombre?: string; cantidad?: number }) =>
                                [p.nombre, p.cantidad ? `x${p.cantidad}` : ""]
                                  .filter(Boolean)
                                  .join(" "),
                              )
                              .join(", ")
                          : typeof parsed === "object" && parsed !== null
                            ? Object.values(parsed).map((v: unknown) => String(v)).join(", ")
                            : String(parsed);
                      } catch {
                        productosText = String(order.productos || "-");
                      }

                      return (
                        <tr key={order.id}>
                          <td>
                            <strong>#{order.id}</strong>
                          </td>
                          <td>{order.cliente?.nombreCompleto || "-"}</td>
                          <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {productosText}
                          </td>
                          <td>S/{Number(order.montoTotal).toFixed(2)}</td>
                          <td>{order.metodoPago || "-"}</td>
                          <td>
                            <span className={`status-badge ${order.estado}`}>
                              {order.estado}
                            </span>
                          </td>
                          <td>{formatDate(order.creadoEn)}</td>
                          <td>
                            <select
                              className="admin-select"
                              value={order.estado}
                              onChange={(e) =>
                                handleStatusChange(order.id, e.target.value)
                              }
                            >
                              <option value="pendiente">Pendiente</option>
                              <option value="completada">Completada</option>
                              <option value="cancelada">Cancelada</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminOrders;
