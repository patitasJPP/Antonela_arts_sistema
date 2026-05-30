import React, { useState, useEffect, useCallback } from "react";
import api from "../../services/api";
import { Producto } from "../../types/_index";

const BG_CLASSES = [
  "bg-pink",
  "bg-dark",
  "bg-sage",
  "bg-clay",
  "bg-cream",
  "bg-forest",
  "bg-orange",
  "bg-teal",
];
export const carritoActual = [];
const Products: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    api
      .get<Producto[]>("/products", { params: { disponible: true } })
      .then((res) => setProductos(res.data))
      .catch((err) => {
        console.error("Error al cargar productos:", err);
        setError("No se pudieron cargar los productos.");
      })
      .finally(() => setLoading(false));
  }, []);

  // 1. Cambiamos la función addToCart para que sea funcional
  const addToCart = (producto: Producto) => {
    setToastMsg(`✓ "${producto.nombre}" añadido`);

    // Obtener lo que ya hay en el carrito (o un array vacío si no hay nada)
    const carritoActual = JSON.parse(localStorage.getItem("carrito") || "[]");

    console.log("Carrito antes de añadir:", carritoActual);

    // Verificar si el producto ya existe para aumentar cantidad o añadir nuevo
    const existe = carritoActual.find((item: any) => item.id === producto.id);

    let nuevoCarrito;
    if (existe) {
      nuevoCarrito = carritoActual.map((item: any) =>
        item.id === producto.id ? { ...item, qty: item.qty + 1 } : item,
      );
    } else {
      // Inyectamos el qty: 1 que necesitabas antes
      nuevoCarrito = [...carritoActual, { ...producto, qty: 1 }];
    }

    // Guardar en LocalStorage para que la página de 'Cart' pueda leerlo
    localStorage.setItem("carrito", JSON.stringify(nuevoCarrito));
    console.log("Carrito actualizado:", nuevoCarrito);
    setTimeout(() => setToastMsg(""), 2400);
  };

  const filtered =
    activeFilter === "all"
      ? productos
      : productos.filter((p) => {
          const desc = (p.descripcion || "").toLowerCase();
          const name = p.nombre.toLowerCase();
          if (activeFilter === "cabello")
            return (
              desc.includes("cabello") ||
              name.includes("cabello") ||
              name.includes("serum") ||
              name.includes("mist")
            );
          if (activeFilter === "piel")
            return (
              desc.includes("piel") ||
              desc.includes("facial") ||
              name.includes("face") ||
              name.includes("mask") ||
              name.includes("vitamin") ||
              name.includes("hand")
            );
          if (activeFilter === "accesorios")
            return desc.includes("gua sha") || name.includes("tool");
          return true;
        });

  useEffect(() => {
    const cards = document.querySelectorAll(".products-grid .card");
    cards.forEach((card, i) => {
      (card as HTMLElement).style.opacity = "0";
      (card as HTMLElement).style.transform = "translateY(18px)";
      setTimeout(() => {
        (card as HTMLElement).style.transition =
          "opacity .35s ease, transform .35s ease, box-shadow .28s";
        (card as HTMLElement).style.opacity = "1";
        (card as HTMLElement).style.transform = "translateY(0)";
      }, i * 60);
    });
  }, [filtered]);

  const formatPrice = (precio: number) =>
    `S/${precio.toFixed(2).replace(".", ",")}`;

  if (loading)
    return (
      <div
        className="container"
        style={{ textAlign: "center", padding: "80px 24px" }}
      >
        <p>Cargando productos...</p>
      </div>
    );
  if (error)
    return (
      <div
        className="container"
        style={{ textAlign: "center", padding: "80px 24px", color: "#c0392b" }}
      >
        <p>{error}</p>
      </div>
    );

  return (
    <>
      <div className="hero">
        <h1>Antonela Art</h1>
        <p>
          Una cuidada selección de productos de belleza de alta gama, diseñados
          para realzar tu belleza natural. Descubre nuestros métodos
          tradicionales, perfeccionados por la ciencia moderna.
        </p>
      </div>

      <div className="filters">
        <span className="filter-label">Filtrar por:</span>
        {[
          { key: "all", label: "Todos los productos" },
          { key: "cabello", label: "Cuidado del cabello" },
          { key: "piel", label: "Protección de la piel" },
          { key: "accesorios", label: "Accesorios" },
        ].map((f) => (
          <button
            key={f.key}
            className={`filter-btn${activeFilter === f.key ? " active" : ""}`}
            onClick={() => setActiveFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="products-grid">
        {filtered.map((p, idx) => (
          <div className="card" key={p.id}>
            <div className={`card-img ${BG_CLASSES[idx % BG_CLASSES.length]}`}>
              <div className="img-placeholder">
                <img src={p.urlImagen || "/img/img1.webp"} alt={p.nombre} />
              </div>
            </div>
            <div className="card-body">
              <div className="card-category">
                {p.nombre.split(" ").slice(0, 2).join(" ")}
              </div>
              <div className="card-name">{p.nombre}</div>
              <div className="card-desc">
                {p.descripcion || "Producto de belleza de alta calidad."}
              </div>
              <div className="card-footer">
                <span className="price">{formatPrice(p.precio)}</span>
                <button className="add-btn" onClick={() => addToCart(p)}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={`toast${toastMsg ? " show" : ""}`}>{toastMsg}</div>
    </>
  );
};

export default Products;
