import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../contexts/CartContext";
import api from "../../services/api";

type MetodoPago = "efectivo" | "simulado_credito";

const fmt = (n: number) => `S/${n.toFixed(2).replace(".", ",")}`;

const Checkout: React.FC = () => {
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();

  const [metodoPago, setMetodoPago] = useState<MetodoPago>("efectivo");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setLoading(true);
    setError("");

    try {
      // api.ts ya agrega el JWT automáticamente en cada request
      const response = await api.post("/cart/checkout", {
        productos: items.map((i) => ({
          id: i.producto.id,
          nombre: i.producto.nombre,
          precio: i.producto.precio,
          cantidad: i.cantidad,
        })),
        metodoPago,
      });

      const { mensaje } = response.data;
      const ordenId = response.data.ordenId ?? Date.now();

      clearCart();
      navigate("/shop/confirmacion", {
        state: { ordenId, montoTotal: total, mensaje },
      });
    } catch (err: any) {
      const msg =
        err.response?.data?.mensaje ||
        err.response?.data ||
        "Error al procesar la orden. Intenta nuevamente.";
      setError(typeof msg === "string" ? msg : "Error al procesar la orden.");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "80px 24px" }}>
        <p>No tienes productos en el carrito.</p>
        <button
          className="checkout-btn"
          onClick={() => navigate("/products")}
          style={{ marginTop: 16 }}
        >
          Ver Productos
        </button>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: "48px 24px", maxWidth: 900 }}>
      <div className="page-title-label">Caja</div>
      <h1 className="page-title" style={{ marginBottom: 32 }}>
        Finalizar Compra
      </h1>

      <div className="checkout-layout">
        <div className="order-summary-card">
          <div className="summary-title" style={{ marginBottom: 16 }}>
            Resumen de tu orden
          </div>
          {items.map(({ producto, cantidad }) => (
            <div className="order-item" key={producto.id}>
              <img
                src={producto.urlImagen || "/img/img1.webp"}
                alt={producto.nombre}
                className="order-img"
                style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8 }}
              />
              <div className="order-item-info">
                <div className="order-item-name">{producto.nombre}</div>
                <div className="order-item-qty">Cantidad: {cantidad}</div>
              </div>
              <div className="order-item-price">
                {fmt(producto.precio * cantidad)}
              </div>
            </div>
          ))}

          <div className="order-totals" style={{ marginTop: 16 }}>
            <div className="order-total-row">
              <span>Subtotal</span>
              <span>{fmt(total)}</span>
            </div>
            <div className="order-total-row">
              <span>Envío</span>
              <span style={{ color: "var(--gold)" }}>Gratis</span>
            </div>
            <div className="order-total-final">
              <div className="lbl">Total</div>
              <div className="amt">{fmt(total)}</div>
            </div>
          </div>
        </div>

        <form className="card-payment-box" onSubmit={handleSubmit}>
          <div className="card-pay-title">Método de pago</div>

          <div className="payment-methods" style={{ marginBottom: 24 }}>
            <button
              type="button"
              className={`pay-method-btn${metodoPago === "efectivo" ? " selected-yape" : ""}`}
              onClick={() => setMetodoPago("efectivo")}
            >
              <span className="pay-icon"><i className="bi bi-cash"></i></span>
              <span className="pay-label">Efectivo</span>
            </button>
            <button
              type="button"
              className={`pay-method-btn${metodoPago === "simulado_credito" ? " selected-card" : ""}`}
              onClick={() => setMetodoPago("simulado_credito")}
            >
              <span className="pay-icon"><i className="bi bi-credit-card"></i></span>
              <span className="pay-label">Tarjeta (simulado)</span>
            </button>
          </div>

          {error && (
            <div style={{
              background: "#ffeaea", color: "#c0392b",
              padding: "12px 16px", borderRadius: 8,
              marginBottom: 16, fontSize: 14,
            }}>
              {error}
            </div>
          )}

          <button type="submit" className="pay-btn-final" disabled={loading}>
            {loading ? "Procesando..." : <><i className="bi bi-shield-check"></i> Confirmar Orden — {fmt(total)}</>}
          </button>

          <button
            type="button"
            className="back-link"
            onClick={() => navigate(-1)}
            style={{ marginTop: 12 }}
          >
            ← Volver
          </button>
        </form>
      </div>
    </div>
  );
};

export default Checkout;