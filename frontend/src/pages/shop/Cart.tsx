import React, { useState } from 'react';

interface CartProduct {
  id: number;
  name: string;
  desc: string;
  emoji: string;
  base: number;
  qty: number;
}

const initialProducts: CartProduct[] = [
  { id: 1, name: 'Sérum Reparador', desc: 'Renovación celular avanzada', emoji: '💜', base: 85, qty: 1 },
  { id: 2, name: 'Crema Hidratante', desc: 'Fórmula de hidratación profunda', emoji: '🧴', base: 60, qty: 2 },
  { id: 3, name: 'Aceite de Cutículas', desc: 'Base nutritiva de vitamina E', emoji: '🫒', base: 32, qty: 1 },
];

const Cart: React.FC = () => {
  const [items, setItems] = useState<CartProduct[]>(initialProducts);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<'cart' | 'yape' | 'card' | 'success'>('cart');

  const getTotal = () => items.reduce((s, p) => s + p.base * p.qty, 0);
  const fmt = (n: number) => 'S/' + n.toFixed(2).replace('.', ',');
  const fmt2 = (n: number) => 'S/ ' + n.toFixed(2);

  const changeQty = (id: number, delta: number) => {
    setItems((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const newQty = p.qty + delta;
        return newQty < 1 ? p : { ...p, qty: newQty };
      })
    );
  };

  const removeItem = (id: number) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
  };

  const selectPayment = (method: string) => {
    setSelectedPayment(method);
  };

  const canCheckout = selectedPayment && items.length > 0;

  const goToCheckout = () => {
    if (selectedPayment === 'yape') setCurrentPage('yape');
    else if (selectedPayment === 'card') setCurrentPage('card');
  };

  const goToSuccess = () => setCurrentPage('success');
  const goBack = (page: 'cart' | 'yape' | 'card') => setCurrentPage(page);
  const resetFlow = () => {
    setCurrentPage('cart');
    setSelectedPayment(null);
  };

  const total = getTotal();
  const stepStyle = (page: string) =>
    currentPage === page ? {} : { color: 'var(--muted)' };

  return (
    <>
      {/* STEP BAR */}
      <div className="step-bar">
        <span style={stepStyle('cart')}>Carrito</span> →
        <span style={stepStyle('yape') || currentPage === 'card' ? {} : { color: 'var(--muted)' }}>Pago</span> →
        <span style={stepStyle('success')}>Confirmación</span>
      </div>

      {/* PAGE: CART */}
      {currentPage === 'cart' && (
        <div className="page active">
          <div className="container">
            <div className="page-title-label">Experiencia de Compra</div>
            <h1 className="page-title">Tus Productos</h1>

            <div className="cart-layout">
              <div className="products-list">
                {items.map((p) => (
                  <div className="product-item" key={p.id}>
                    <div className="product-img">{p.emoji}</div>
                    <div className="product-info">
                      <div className="product-name">{p.name}</div>
                      <div className="product-desc">{p.desc}</div>
                      <div className="qty-row">
                        <div className="qty-ctrl">
                          <button className="qty-btn" onClick={() => changeQty(p.id, -1)}>−</button>
                          <div className="qty-val">{p.qty}</div>
                          <button className="qty-btn" onClick={() => changeQty(p.id, 1)}>+</button>
                        </div>
                        <button className="remove-btn" onClick={() => removeItem(p.id)}>Eliminar</button>
                      </div>
                    </div>
                    <div className="product-price">{fmt(p.base * p.qty)}</div>
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

                  <div className="payment-select-title">¿Cómo deseas pagar?</div>
                  <div className="payment-methods">
                    <button
                      className={`pay-method-btn${selectedPayment === 'yape' ? ' selected-yape' : ''}`}
                      onClick={() => selectPayment('yape')}
                    >
                      <span className="pay-icon">📱</span>
                      <span className="pay-label">Yape / QR</span>
                    </button>
                    <button
                      className={`pay-method-btn${selectedPayment === 'card' ? ' selected-card' : ''}`}
                      onClick={() => selectPayment('card')}
                    >
                      <span className="pay-icon">💳</span>
                      <span className="pay-label">Tarjeta BCP</span>
                    </button>
                  </div>

                  <button className="checkout-btn" onClick={goToCheckout} disabled={!canCheckout}>
                    Continuar al Pago →
                  </button>
                  <div className="secure-note">🔒 Pago seguro y encriptado</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PAGE: YAPE */}
      {currentPage === 'yape' && (
        <div className="page active">
          <div className="container">
            <div className="page-title-label">Caja & Pedido</div>
            <h1 className="page-title">Resumen de tu Orden</h1>
            <div className="checkout-layout">
              <div className="order-summary-card">
                {items.map((p) => (
                  <div className="order-item" key={p.id}>
                    <div className="order-img">{p.emoji}</div>
                    <div className="order-item-info">
                      <div className="order-item-name">{p.name}</div>
                      <div className="order-item-desc">{p.desc}</div>
                      <div className="order-item-qty">Cantidad: {p.qty}</div>
                    </div>
                    <div className="order-item-price">{fmt2(p.base * p.qty)}</div>
                  </div>
                ))}
                <div className="order-totals">
                  <div className="order-total-row"><span>Subtotal</span><span>{fmt2(total)}</span></div>
                  <div className="order-total-row"><span>Envío Prioritario</span><span style={{ color: 'var(--gold)' }}>Gratis</span></div>
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
                <div className="yape-icon-wrap">📱</div>
                <div className="yape-title">Pago con Yape</div>
                <div className="yape-subtitle">Escanea el código QR desde tu app</div>
                <div className="qr-wrapper"><div className="qr-mock">▦</div></div>
                <div className="yape-or">O yapea al número</div>
                <div className="yape-number">📱 987 654 321</div>
                <button className="confirm-btn yape-confirm" onClick={goToSuccess}>CONFIRMAR PAGO</button>
                <div className="info-note">
                  📋 Por favor, una vez realizado el pago, envía la captura de pantalla de la confirmación a nuestro WhatsApp para validar tu orden de inmediato.
                </div>
                <button className="back-link" onClick={() => goBack('cart')}>← Volver al Carrito</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PAGE: CARD */}
      {currentPage === 'card' && (
        <div className="page active">
          <div className="container">
            <div className="page-title-label">Resumen de Compra</div>
            <h1 className="page-title">Tu Selección Editorial</h1>
            <div className="checkout-layout">
              <div className="order-summary-card">
                {items.map((p) => (
                  <div className="order-item" key={p.id}>
                    <div className="order-img">{p.emoji}</div>
                    <div className="order-item-info">
                      <div className="order-item-name">{p.name}</div>
                      <div className="order-item-desc">{p.desc}</div>
                      <div className="order-item-qty">Cantidad: {p.qty}</div>
                    </div>
                    <div className="order-item-price">{fmt2(p.base * p.qty)}</div>
                  </div>
                ))}
                <div className="order-totals">
                  <div className="order-total-row"><span>Subtotal</span><span>{fmt2(total)}</span></div>
                  <div className="order-total-row"><span>Envío / Reserva</span><span style={{ color: 'var(--gold)' }}>Gratis</span></div>
                  <div className="order-total-final">
                    <div className="lbl">Total</div>
                    <div className="amt">{fmt2(total)}</div>
                  </div>
                </div>
                <div className="editorial-quote">✦ "Cada detalle en el Atelier está diseñado para elevar tu bienestar. Tu transacción es segura y privada."</div>
              </div>

              <div className="card-payment-box">
                <div className="card-pay-title">Pago con Tarjeta BCP</div>
                <div className="card-pay-sub">Transacción cifrada punto a punto</div>
                <div className="card-logos">
                  <div className="card-logo">VISA</div>
                  <div className="card-logo">MC</div>
                  <div className="card-logo bcp">BCP</div>
                </div>
                <div className="form-group">
                  <label className="form-label">Número de Tarjeta</label>
                  <input type="text" className="form-input" placeholder="0000 0000 0000 0000" maxLength={19} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Fecha de Expiración</label>
                    <input type="text" className="form-input" placeholder="MM / YY" maxLength={5} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">CVV</label>
                    <input type="password" className="form-input" placeholder="•••" maxLength={3} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Nombre del Titular</label>
                  <input type="text" className="form-input" placeholder="Como figura en la tarjeta" />
                </div>
                <button className="pay-btn-final" onClick={goToSuccess}>
                  🛡️ Pagar <span>{fmt2(total)}</span>
                </button>
                <div className="terms-note">
                  Al procesar el pago, aceptas nuestros <a href="#">Términos de Servicio</a> y <a href="#">Políticas de Privacidad</a>.
                </div>
                <button className="back-link" onClick={() => goBack('cart')}>← Volver al Carrito</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PAGE: SUCCESS */}
      {currentPage === 'success' && (
        <div className="page active">
          <div className="container">
            <div className="success-wrap">
              <span className="success-icon">✨</span>
              <div className="success-title">¡Orden Confirmada!</div>
              <div className="success-msg">
                Gracias por tu compra en Antonela Art. Recibirás una confirmación
                pronto y tu pedido será preparado con la mayor delicadeza.<br /><br />
                Si pagaste con Yape, recuerda enviar tu captura al WhatsApp para
                activar tu orden de inmediato.
              </div>
              <button className="success-btn" onClick={resetFlow}>Seguir Comprando</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Cart;
