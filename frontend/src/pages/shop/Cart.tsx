import React, { useState } from "react";
import { useCart } from "../../contexts/CartContext";
import api from "../../services/api";

const Cart: React.FC = () => {
  const { items, updateQuantity: updateCartQty, removeItem: removeCartItem, total, clearCart } = useCart();
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<
    "cart" | "yape" | "card" | "success"
  >("cart");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const fmt = (n: number) => "S/" + n.toFixed(2).replace(".", ",");
  const fmt2 = (n: number) => "S/ " + n.toFixed(2);

  const changeQty = (id: number, delta: number) => {
    const item = items.find((i) => i.producto.id === id);
    if (item) updateCartQty(id, item.cantidad + delta);
  };

  const selectPayment = (method: string) => {
    setSelectedPayment(method);
  };

  const canCheckout = selectedPayment && items.length > 0;

  const goToCheckout = () => {
    if (selectedPayment === "yape") setCurrentPage("yape");
    else if (selectedPayment === "card") setCurrentPage("card");
  };

  const handlePayment = async () => {
    setPaymentLoading(true);
    setPaymentError(null);
    try {
      const productos = items.map((i) => ({
        id: i.producto.id,
        nombre: i.producto.nombre,
        precio: i.producto.precio,
        cantidad: i.cantidad,
      }));
      const metodoPago = selectedPayment || "yape";
      await api.post("/cart/checkout", { productos, metodoPago });
      clearCart();
      setCurrentPage("success");
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Error al procesar el pago";
      setPaymentError(msg);
    } finally {
      setPaymentLoading(false);
    }
  };
  const goToSuccess = () => {
    clearCart();
    setCurrentPage("success");
  };
  const goBack = (page: "cart" | "yape" | "card") => setCurrentPage(page);
  const resetFlow = () => {
    setCurrentPage("cart");
    setSelectedPayment(null);
  };
  const stepStyle = (page: string) =>
    currentPage === page ? {} : { color: "var(--muted)" };

  return (
    <>
      {/* STEP BAR */}
      <div className="step-bar">
        <span style={stepStyle("cart")}>Carrito</span> →
        <span
          style={
            stepStyle("yape") || currentPage === "card"
              ? {}
              : { color: "var(--muted)" }
          }
        >
          Pago
        </span>{" "}
        →<span style={stepStyle("success")}>Confirmación</span>
      </div>

      {/* PAGE: CART */}
      {currentPage === "cart" && (
        <div className="page active">
          <div className="container">
            <div className="page-title-label">Experiencia de Compra</div>
            <h1 className="page-title">Tus Productos</h1>

            <div className="cart-layout">
              <div className="products-list">
                {items.map((p) => (
                  <div className="product-item" key={p.producto.id}>
                    <div className="product-img"><img src={p.producto.urlImagen || "/img/img1.webp"} alt={p.producto.nombre} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'8px'}} /></div>
                    <div className="product-info">
                      <div className="product-name">{p.producto.nombre}</div>
                      <div className="product-desc">{p.producto.precio}</div>
                      <div className="qty-row">
                        <div className="qty-ctrl">
                          <button
                            className="qty-btn"
                            onClick={() => changeQty(p.producto.id, -1)}
                          >
                            −
                          </button>
                          <div className="qty-val">{p.cantidad}</div>
                          <button
                            className="qty-btn"
                            onClick={() => changeQty(p.producto.id, 1)}
                          >
                            +
                          </button>
                        </div>
                        <button
                          className="remove-btn"
                          onClick={() => removeCartItem(p.producto.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                    <div className="product-price">{fmt(p.producto.precio * p.cantidad)}</div>
                  </div>
                ))}
              </div>

              <div className="sidebar">
                <div className="summary-card">
                  <div className="summary-title">Resumen</div>
                  <div className="summary-row">
                    <span className="label">Subtotal</span>
                    <span>{fmt(total)}</span>
                  </div>
                  <div className="summary-row">
                    <span className="label">Envío</span>
                    <span className="free">Gratis</span>
                  </div>
                  <hr className="summary-divider" />
                  <div className="total-row">
                    <div className="total-label">Total</div>
                    <div className="total-amount">{fmt(total)}</div>
                  </div>

                  <div className="payment-select-title">
                    ¿Cómo deseas pagar?
                  </div>
                  <div className="payment-methods">
                    <button
                      className={`pay-method-btn${selectedPayment === "yape" ? " selected-yape" : ""}`}
                      onClick={() => selectPayment("yape")}
                    >
                      <span className="pay-icon"><i className="bi bi-phone"></i></span>
                      <span className="pay-label">Yape / QR</span>
                    </button>
                    <button
                      className={`pay-method-btn${selectedPayment === "card" ? " selected-card" : ""}`}
                      onClick={() => selectPayment("card")}
                    >
                      <span className="pay-icon"><i className="bi bi-credit-card"></i></span>
                      <span className="pay-label">Tarjeta BCP</span>
                    </button>
                  </div>

                  <button
                    className="checkout-btn"
                    onClick={goToCheckout}
                    disabled={!canCheckout}
                  >
                    Continuar al Pago →
                  </button>
                  <div className="secure-note"><i className="bi bi-shield-lock"></i> Pago seguro y encriptado</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PAGE: YAPE */}
      {currentPage === "yape" && (
        <div className="page active">
          <div className="container">
            <div className="page-title-label">Caja & Pedido</div>
            <h1 className="page-title">Resumen de tu Orden</h1>
            <div className="checkout-layout">
              <div className="order-summary-card">
                {items.map((p) => (
                  <div className="order-item" key={p.producto.id}>
                    <div className="order-img"><img src={p.producto.urlImagen || "/img/img1.webp"} alt={p.producto.nombre} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'8px'}} /></div>
                    <div className="order-item-info">
                      <div className="order-item-name">{p.producto.nombre}</div>
                      <div className="order-item-desc">{p.producto.descripcion}</div>
                      <div className="order-item-qty">Cantidad: {p.cantidad}</div>
                    </div>
                    <div className="order-item-price">
                      {fmt2(p.producto.precio * p.cantidad)}
                    </div>
                  </div>
                ))}
                <div className="order-totals">
                  <div className="order-total-row">
                    <span>Subtotal</span>
                    <span>{fmt2(total)}</span>
                  </div>
                  <div className="order-total-row">
                    <span>Envío Prioritario</span>
                    <span style={{ color: "var(--gold)" }}>Gratis</span>
                  </div>
                  <div className="order-total-final">
                    <div className="lbl">Total</div>
                    <div>
                      <div className="amt">{fmt2(total)}</div>
                      <div className="igv-note">IGV incluido</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="yape-card">
                <div className="yape-icon-wrap"><i className="bi bi-phone" style={{fontSize:32}}></i></div>
                <div className="yape-title">Pago con Yape</div>
                <div className="yape-subtitle">
                  Escanea el código QR desde tu app
                </div>
                <div className="qr-wrapper">
                  <div className="qr-mock"><i className="bi bi-qr-code" style={{fontSize:48}}></i></div>
                </div>
                <div className="yape-or">O yapea al número</div>
                <div className="yape-number"><i className="bi bi-phone"></i> 987 654 321</div>
                {paymentError && <div style={{color:'#b03030',padding:'10px',textAlign:'center',fontSize:'13px'}}>{paymentError}</div>}
                <button
                  className="confirm-btn yape-confirm"
                  onClick={handlePayment}
                  disabled={paymentLoading}
                >
                  {paymentLoading ? "PROCESANDO..." : "CONFIRMAR PAGO"}
                </button>
                  <div className="info-note">
                    <i className="bi bi-info-circle"></i> Por favor, una vez realizado el pago, envía la captura de
                  pantalla de la confirmación a nuestro WhatsApp para validar tu
                  orden de inmediato.
                </div>
                <button className="back-link" onClick={() => goBack("cart")}>
                  ← Volver al Carrito
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PAGE: CARD */}
      {currentPage === "card" && (
        <div className="page active">
          <div className="container">
            <div className="page-title-label">Resumen de Compra</div>
            <h1 className="page-title">Tu Selección Editorial</h1>
            <div className="checkout-layout">
              <div className="order-summary-card">
                {items.map((p) => (
                  <div className="order-item" key={p.producto.id}>
                    <div className="order-img"><img src={p.producto.urlImagen || "/img/img1.webp"} alt={p.producto.nombre} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'8px'}} /></div>
                    <div className="order-item-info">
                      <div className="order-item-name">{p.producto.nombre}</div>
                      <div className="order-item-desc">{p.producto.descripcion}</div>
                      <div className="order-item-qty">Cantidad: {p.cantidad}</div>
                    </div>
                    <div className="order-item-price">
                      {fmt2(p.producto.precio * p.cantidad)}
                    </div>
                  </div>
                ))}
                <div className="order-totals">
                  <div className="order-total-row">
                    <span>Subtotal</span>
                    <span>{fmt2(total)}</span>
                  </div>
                  <div className="order-total-row">
                    <span>Envío / Reserva</span>
                    <span style={{ color: "var(--gold)" }}>Gratis</span>
                  </div>
                  <div className="order-total-final">
                    <div className="lbl">Total</div>
                    <div className="amt">{fmt2(total)}</div>
                  </div>
                </div>
                <div className="editorial-quote">
                  <i className="bi bi-star-fill" style={{color:'var(--gold)',fontSize:10}}></i> "Cada detalle en el Atelier está diseñado para elevar tu
                  bienestar. Tu transacción es segura y privada."
                </div>
              </div>

              <div className="card-payment-box">
                <div className="card-pay-title">Pago con Tarjeta BCP</div>
                <div className="card-pay-sub">
                  Transacción cifrada punto a punto
                </div>
                <div className="card-logos">
                  <div className="card-logo">VISA</div>
                  <div className="card-logo">MC</div>
                  <div className="card-logo bcp">BCP</div>
                </div>
                <div className="form-group">
                  <label className="form-label">Número de Tarjeta</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                  />
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                  }}
                >
                  <div className="form-group">
                    <label className="form-label">Fecha de Expiración</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="MM / YY"
                      maxLength={5}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">CVV</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="•••"
                      maxLength={3}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Nombre del Titular</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Como figura en la tarjeta"
                  />
                </div>
                {paymentError && <div style={{color:'#b03030',padding:'10px',textAlign:'center',fontSize:'13px'}}>{paymentError}</div>}
                <button className="pay-btn-final" onClick={handlePayment} disabled={paymentLoading}>
                  {paymentLoading ? "PROCESANDO..." : <><i className="bi bi-shield-check"></i> Pagar <span>{fmt2(total)}</span></>}
                </button>
                <div className="terms-note">
                  Al procesar el pago, aceptas nuestros{" "}
                  <a href="#">Términos de Servicio</a> y{" "}
                  <a href="#">Políticas de Privacidad</a>.
                </div>
                <button className="back-link" onClick={() => goBack("cart")}>
                  ← Volver al Carrito
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PAGE: SUCCESS */}
      {currentPage === "success" && (
        <div className="page active">
          <div className="container">
            <div className="success-wrap">
              <span className="success-icon"><i className="bi bi-check-circle-fill" style={{fontSize:48,color:'var(--gold)'}}></i></span>
              <div className="success-title">¡Orden Confirmada!</div>
              <div className="success-msg">
                Gracias por tu compra en Antonela Art. Recibirás una
                confirmación pronto y tu pedido será preparado con la mayor
                delicadeza.
                <br />
                <br />
                Si pagaste con Yape, recuerda enviar tu captura al WhatsApp para
                activar tu orden de inmediato.
              </div>
              <button className="success-btn" onClick={resetFlow}>
                Seguir Comprando
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Cart;
