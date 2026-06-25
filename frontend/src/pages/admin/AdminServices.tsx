import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { Servicio } from "../../types/_index";
import "../../styles/admin.scss";

interface ModalData {
  open: boolean;
  editing: Servicio | null;
  nombre: string;
  descripcion: string;
  precioMinimo: string;
  precioMaximo: string;
}

const emptyModal = (): ModalData => ({
  open: false,
  editing: null,
  nombre: "",
  descripcion: "",
  precioMinimo: "",
  precioMaximo: "",
});

const AdminServices: React.FC = () => {
  const [services, setServices] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<ModalData>(emptyModal);

  const fetchServices = async () => {
    try {
      const res = await api.get("/admin/services");
      setServices(res.data);
    } catch {
      setError("Error al cargar servicios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const openCreate = () => {
    setModal({
      open: true,
      editing: null,
      nombre: "",
      descripcion: "",
      precioMinimo: "",
      precioMaximo: "",
    });
  };

  const openEdit = (s: Servicio) => {
    setModal({
      open: true,
      editing: s,
      nombre: s.nombre,
      descripcion: s.descripcion || "",
      precioMinimo: String(s.precioMinimo),
      precioMaximo: s.precioMaximo != null ? String(s.precioMaximo) : "",
    });
  };

  const closeModal = () => setModal(emptyModal());

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      nombre: modal.nombre.trim(),
      descripcion: modal.descripcion.trim() || undefined,
      precioMinimo: parseFloat(modal.precioMinimo),
      precioMaximo: modal.precioMaximo.trim()
        ? parseFloat(modal.precioMaximo)
        : undefined,
    };

    try {
      if (modal.editing) {
        const res = await api.put(`/admin/services/${modal.editing.id}`, payload);
        setServices((prev) =>
          prev.map((s) => (s.id === modal.editing!.id ? res.data : s)),
        );
      } else {
        const res = await api.post("/admin/services", payload);
        setServices((prev) => [...prev, res.data]);
      }
      closeModal();
    } catch {
      setError("Error al guardar servicio");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/admin/services/${id}`);
      setServices((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setError("Error al eliminar servicio");
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <span className="spinner" />
        Cargando servicios...
      </div>
    );
  }

  return (
    <>
      <div className="admin-header">
        <div className="admin-header-title">
          <h1>Servicios</h1>
          <p>{services.length} servicios registrados</p>
        </div>
        <div className="admin-header-actions">
          <button className="admin-btn admin-btn-gold" onClick={openCreate}>
            <i className="bi bi-plus-lg" />
            Nuevo Servicio
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
            {services.length === 0 ? (
              <div className="admin-empty">
                <i className="bi bi-tools" />
                <p>No hay servicios registrados</p>
                <button
                  className="admin-btn admin-btn-gold"
                  style={{ marginTop: 16 }}
                  onClick={openCreate}
                >
                  <i className="bi bi-plus-lg" />
                  Crear primer servicio
                </button>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nombre</th>
                      <th>Descripción</th>
                      <th>Precio Mín</th>
                      <th>Precio Máx</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((s) => (
                      <tr key={s.id}>
                        <td>
                          <strong>#{s.id}</strong>
                        </td>
                        <td>{s.nombre}</td>
                        <td style={{ maxWidth: 250, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {s.descripcion || "-"}
                        </td>
                        <td>${Number(s.precioMinimo).toFixed(2)}</td>
                        <td>
                          {s.precioMaximo != null
                            ? `$${Number(s.precioMaximo).toFixed(2)}`
                            : "-"}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              className="admin-btn admin-btn-outline admin-btn-sm"
                              onClick={() => openEdit(s)}
                            >
                              <i className="bi bi-pencil" />
                              Editar
                            </button>
                            <button
                              className="admin-btn admin-btn-danger admin-btn-sm"
                              onClick={() => handleDelete(s.id)}
                            >
                              <i className="bi bi-trash3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {modal.open && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{modal.editing ? "Editar Servicio" : "Nuevo Servicio"}</h2>
              <button className="admin-modal-close" onClick={closeModal}>
                <i className="bi bi-x" />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="admin-modal-body">
                <div className="admin-form">
                  <div className="admin-form-group">
                    <label>Nombre del servicio</label>
                    <input
                      type="text"
                      placeholder="ej. Maquillaje Profesional"
                      value={modal.nombre}
                      onChange={(e) =>
                        setModal((prev) => ({ ...prev, nombre: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Descripción</label>
                    <textarea
                      placeholder="Describe el servicio..."
                      value={modal.descripcion}
                      onChange={(e) =>
                        setModal((prev) => ({
                          ...prev,
                          descripcion: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="admin-form-row-2">
                    <div className="admin-form-group">
                      <label>Precio mínimo ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={modal.precioMinimo}
                        onChange={(e) =>
                          setModal((prev) => ({
                            ...prev,
                            precioMinimo: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div className="admin-form-group">
                      <label>Precio máximo ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Opcional"
                        value={modal.precioMaximo}
                        onChange={(e) =>
                          setModal((prev) => ({
                            ...prev,
                            precioMaximo: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn admin-btn-outline"
                  onClick={closeModal}
                >
                  Cancelar
                </button>
                <button type="submit" className="admin-btn admin-btn-gold">
                  {modal.editing ? "Guardar Cambios" : "Crear Servicio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminServices;
