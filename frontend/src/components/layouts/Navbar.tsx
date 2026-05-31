import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "../../contexts/CartContext";
import CartSidebar from "../CartSidebar";

const navItems = [
  { path: "/", label: "Inicio" },
  { path: "/services", label: "Servicios" },
  { path: "/products", label: "Productos" },
  { path: "/booking", label: "Reserva Cita" },
];

const Navbar: React.FC = () => {
  const location = useLocation();
  const { items } = useCart();
  const [cartOpen, setCartOpen] = useState(false);

  const totalItems = items.reduce((sum, i) => sum + i.cantidad, 0);

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/" ? "active" : "";
    return location.pathname.startsWith(path) ? "active" : "";
  };

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="logo">
          <div className="logo-icon">
            <img src="/img/logo antonela art.png" alt="Antonela Art" />
          </div>
          Antonela Art
        </Link>

        <ul className="nav-links">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link to={item.path} className={isActive(item.path)}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="nav-icons">
          <button
            className="nav-cart-btn"
            onClick={() => setCartOpen(true)}
            aria-label={`Abrir carrito (${totalItems} productos)`}
          >
            <i className="bi bi-bag" />
            {totalItems > 0 && (
              <span className="cart-badge">{totalItems}</span>
            )}
          </button>

          <Link to="/login">
            <i className="bi bi-person" />
          </Link>
        </div>
      </nav>

      <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
};

export default Navbar;