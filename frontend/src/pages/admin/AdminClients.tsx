import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { Cliente, Cita, OrdenCompra } from "../../types/_index";
import "../../styles/admin.scss";

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

interface ClientDetail {
  citas: Cita[];
  ordenes: OrdenCompra[];
}

const AdminClients: React.FC = () => {
  const [clients, setClients] = useState<Cliente[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Cliente | null>(null);
  const [detail, setDetail] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await api.get("/admin/clients");
        setClients(res.data);
      } catch {
        setError("Error al cargar clientes");
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  const filtered = clients.filter(
    (c) =>
      c.nombreCompleto.toLowerCase().includes(search.toLowerCase()) ||
      c.correoElectronico.toLowerCase().includes(search.toLowerCase()) ||
      c.telefono.includes(search),
  );

  const selectClient = async (client: Cliente) => {
    setSelected(client);
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await api.get(`/admin/clients/${client.id}`);
      setDetail(res.data);
    } catch {
      setError("Error al cargar detalle del cliente");
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <span className="spinner" />
        Cargando clientes...
      </div>
    );
  }

  return (
    <>
      <div className="admin-header">
        <div className="admin-header-title">
          <h1>Clientes</h1>
          <p>{clients.length} clientes registrados</p>
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
            <div className="admin-grid-2" style={{ gap: 0 }}>
              <div className="admin-client-list">
                <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
                  <div className="admin-search">
                    <i className="bi bi-search" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre, correo o teléfono..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>

                {filtered.length === 0 ? (
                  <div className="admin-empty">
                    <i className="bi bi-people" />
                    <p>No se encontraron clientes</p>
                  </div>
                ) : (
                  filtered.map((c) => (
                    <div
                      key={c.id}
                      className={`admin-client-item${selected?.id === c.id ? " selected" : ""}`}
                      onClick={() => selectClient(c)}
                    >
                      <div className="admin-client-avatar">
                        {c.nombreCompleto.charAt(0).toUpperCase()}
                      </div>
                      <div className="admin-client-info">
                        <h4>{c.nombreCompleto}</h4>
                        <p>{c.correoElectronico}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="admin-client-detail">
                {detailLoading ? (
                  <div className="admin-loading">
                    <span className="spinner" />
                    Cargando detalle...
                  </div>
                ) : selected ? (
                  <>
                    <div className="admin-detail-header">
                      <div className="admin-detail-avatar">
                        {selected.nombreCompleto.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h2 className="admin-detail-name">{selected.nombreCompleto}</h2>
                        <p className="admin-detail-email">{selected.correoElectronico}</p>
                      </div>
                    </div>

                    <div className="admin-detail-section">
                      <h3>Información</h3>
                      <div className="admin-detail-row">
                        <span className="key">Teléfono</span>
                        <span className="val">{selected.telefono || "-"}</span>
                      </div>
                      <div className="admin-detail-row">
                        <span className="key">Registrado</span>
                        <span className="val">{formatDate(selected.creadoEn)}</span>
                      </div>
                    </div>

                    <div className="admin-detail-section">
                      <h3>Citas ({detail?.citas?.length || 0})</h3>
                      {detail?.citas && detail.citas.length > 0 ? (
                        detail.citas.map((cita) => (
                          <div key={cita.id} className="admin-detail-row">
                            <span className="key">
                              {new Date(cita.fechaCita + "T" + cita.horaCita).toLocaleString("es-MX", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <span className={`status-badge ${cita.estado}`}>
                              {cita.estado}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="admin-empty" style={{ padding: "16px 0" }}>
                          <p>Sin citas registradas</p>
                        </div>
                      )}
                    </div>

                    <div className="admin-detail-section">
                      <h3>Órdenes ({detail?.ordenes?.length || 0})</h3>
                      {detail?.ordenes && detail.ordenes.length > 0 ? (
                        detail.ordenes.map((orden) => (
                          <div key={orden.id} className="admin-detail-row">
                            <span className="key">
                              #{orden.id} — S/{Number(orden.montoTotal).toFixed(2)}
                            </span>
                            <span className={`status-badge ${orden.estado}`}>
                              {orden.estado}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="admin-empty" style={{ padding: "16px 0" }}>
                          <p>Sin órdenes registradas</p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="admin-empty">
                    <i className="bi bi-arrow-left" />
                    <p>Selecciona un cliente para ver su detalle</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminClients;
