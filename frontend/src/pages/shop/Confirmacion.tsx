import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

interface LocationState {
  ordenId?: number | string;
  montoTotal?: number;
  mensaje?: string;
}

const fmt = (n: number) => `S/${n.toFixed(2).replace(".", ",")}`;

const Confirmacion: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as LocationState) || {};
  const { ordenId, montoTotal, mensaje } = state;

  return (
    <div className="container" style={{ padding: "80px 24px" }}>
      <div className="success-wrap">
        <span className="success-icon">✨</span>

        <div className="success-title">¡Orden Confirmada!</div>

        {ordenId && (
          <div style={{ color: "var(--muted)", fontSize: 14, marginBottom: 8 }}>
            N° de orden: <strong>#{ordenId}</strong>
          </div>
        )}

        {montoTotal !== undefined && (
          <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 16 }}>
            Total pagado: {fmt(montoTotal)}
          </div>
        )}

        <div className="success-msg">
          {mensaje ||
            "Gracias por tu compra en Antonela Art. Tu pedido fue registrado exitosamente y será preparado con la mayor delicadeza."}
        </div>

        <button
          className="success-btn"
          onClick={() => navigate("/products")}
          style={{ marginTop: 32 }}
        >
          Volver al Catálogo
        </button>
      </div>
    </div>
  );
};

export default Confirmacion;