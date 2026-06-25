import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { ImagenGaleria } from "../../types/_index";
import "../../styles/admin.scss";

const AdminGallery: React.FC = () => {
  const [images, setImages] = useState<ImagenGaleria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [url, setUrl] = useState("");
  const [cat, setCat] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchImages = async () => {
    try {
      const res = await api.get("/admin/gallery");
      setImages(res.data);
    } catch {
      setError("Error al cargar galería");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/admin/gallery/${id}`);
      setImages((prev) => prev.filter((img) => img.id !== id));
    } catch {
      setError("Error al eliminar imagen");
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post("/admin/gallery", {
        urlImagen: url.trim(),
        categoria: cat.trim() || undefined,
      });
      setImages((prev) => [res.data, ...prev]);
      setUrl("");
      setCat("");
      setShowForm(false);
    } catch {
      setError("Error al agregar imagen");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <span className="spinner" />
        Cargando galería...
      </div>
    );
  }

  return (
    <>
      <div className="admin-header">
        <div className="admin-header-title">
          <h1>Galería</h1>
          <p>{images.length} imágenes</p>
        </div>
        <div className="admin-header-actions">
          <button
            className="admin-btn admin-btn-gold"
            onClick={() => setShowForm(true)}
          >
            <i className="bi bi-plus-lg" />
            Agregar Imagen
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

        {images.length === 0 ? (
          <div className="admin-card">
            <div className="admin-empty">
              <i className="bi bi-images" />
              <p>No hay imágenes en la galería</p>
              <button
                className="admin-btn admin-btn-gold"
                style={{ marginTop: 16 }}
                onClick={() => setShowForm(true)}
              >
                <i className="bi bi-plus-lg" />
                Agregar primera imagen
              </button>
            </div>
          </div>
        ) : (
          <div className="admin-gallery-grid">
            {images.map((img) => (
              <div key={img.id} className="admin-gallery-item">
                <img
                  src={img.urlImagen}
                  alt={img.categoria || "Imagen de galería"}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://placehold.co/400x400/1a1a1a/888?text=Sin+Imagen";
                  }}
                />
                <div className="admin-gallery-item-overlay">
                  <button
                    className="admin-gallery-delete"
                    onClick={() => handleDelete(img.id)}
                    title="Eliminar imagen"
                  >
                    <i className="bi bi-trash3" />
                  </button>
                </div>
                {img.categoria && (
                  <div className="admin-gallery-category">{img.categoria}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="admin-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>Agregar Imagen</h2>
              <button
                className="admin-modal-close"
                onClick={() => setShowForm(false)}
              >
                <i className="bi bi-x" />
              </button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="admin-modal-body">
                <div className="admin-form">
                  <div className="admin-form-group">
                    <label>URL de la imagen</label>
                    <input
                      type="url"
                      placeholder="https://ejemplo.com/imagen.jpg"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      required
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Categoría (opcional)</label>
                    <input
                      type="text"
                      placeholder="ej. Maquillaje, Peinados, Uñas..."
                      value={cat}
                      onChange={(e) => setCat(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn admin-btn-outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-gold"
                  disabled={submitting}
                >
                  {submitting ? "Agregando..." : "Agregar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminGallery;
