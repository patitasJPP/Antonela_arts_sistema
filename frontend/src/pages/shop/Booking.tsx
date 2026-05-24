import React, { useState, useEffect } from 'react';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DAYS = ['LU', 'MA', 'MI', 'JU', 'VI', 'SA', 'DO'];

interface BookingState {
  service: string | null;
  servicePrice: number;
  pro: string | null;
  date: { d: number; m: number; y: number } | null;
  time: string | null;
}

const Booking: React.FC = () => {
  const [state, setState] = useState<BookingState>({
    service: null,
    servicePrice: 0,
    pro: null,
    date: null,
    time: null,
  });
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [page, setPage] = useState<'booking' | 'success'>('booking');

  const allDone = state.service && state.pro && state.date && state.time;

  const updateSummary = (newState: BookingState) => {
    setState(newState);
  };

  const selectService = (name: string, price: number) => {
    updateSummary({ ...state, service: name, servicePrice: price });
  };

  const selectPro = (name: string) => {
    updateSummary({ ...state, pro: name });
  };

  const selectTime = (time: string) => {
    updateSummary({ ...state, time });
  };

  const selectDay = (day: number) => {
    updateSummary({ ...state, date: { d: day, m: calMonth, y: calYear } });
  };

  const renderCalendar = () => {
    const first = new Date(calYear, calMonth, 1).getDay();
    const offset = first === 0 ? 6 : first - 1;
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const today = new Date();
    const cells: React.ReactNode[] = [];

    DAYS.forEach((d) => cells.push(<div className="cal-day-header" key={`h-${d}`}>{d}</div>));

    for (let i = 0; i < offset; i++) {
      const prevDays = new Date(calYear, calMonth, 0).getDate();
      cells.push(<div className="cal-day empty disabled" key={`e-${i}`}>{prevDays - offset + i + 1}</div>);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const thisDate = new Date(calYear, calMonth, d);
      const isPast = thisDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const isToday = d === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
      const isSelected = state.date?.d === d && state.date?.m === calMonth && state.date?.y === calYear;

      cells.push(
        <div
          key={d}
          className={`cal-day${isPast ? ' disabled' : ''}${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}`}
          onClick={() => !isPast && selectDay(d)}
        >
          {d}
        </div>
      );
    }
    return cells;
  };

  const goToSuccess = () => {
    setPage('success');
  };

  const resetFlow = () => {
    setState({ service: null, servicePrice: 0, pro: null, date: null, time: null });
    setPage('booking');
  };

  return (
    <>
      {/* PAGE: BOOKING */}
      {page === 'booking' && (
        <div className="page active">
          <div className="container">
            <div className="booking-header">
              <h1>Reserva tu Cita</h1>
              <p>Reserva tu experiencia personalizada en unos pocos pasos.</p>
            </div>

            <div className="booking-layout">
              <div className="booking-steps">
                {/* STEP 1: SERVICE */}
                <div className="step-block">
                  <div className="step-label">1. Selecciona un Servicio</div>
                  <div className="service-list">
                    {[
                      { name: 'Corte & Styling Premium', meta: '90 min · S/120.00', price: 120 },
                      { name: 'Coloración Orgánica', meta: '120 min · S/150.00', price: 150 },
                      { name: 'Tratamiento Hidratante', meta: '45 min · S/85.00', price: 85 },
                    ].map((svc, i) => (
                      <div
                        key={i}
                        className={`service-item${state.service === svc.name ? ' selected' : ''}`}
                        onClick={() => selectService(svc.name, svc.price)}
                      >
                        <div>
                          <div className="svc-name">{svc.name}</div>
                          <div className="svc-meta">{svc.meta}</div>
                        </div>
                        <div className="check">✓</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* STEP 2: PROFESSIONAL */}
                <div className="step-block">
                  <div className="step-label">2. Elige a tu Profesional</div>
                  <div className="pro-grid">
                    {[
                      { name: 'Adriana Velasco', role: 'Masterstylist', avatar: '👩‍🎨' },
                      { name: 'Julian Rossi', role: 'Colorexpert', avatar: '👨‍🎨' },
                    ].map((pro, i) => (
                      <div
                        key={i}
                        className={`pro-item${state.pro === pro.name ? ' selected' : ''}`}
                        onClick={() => selectPro(pro.name)}
                      >
                        <div className="pro-avatar">{pro.avatar}</div>
                        <div className="pro-info">
                          <div className="pro-name">{pro.name}</div>
                          <div className="pro-role">{pro.role}</div>
                        </div>
                        <div className="pro-check">✓</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* STEP 3: DATE & TIME */}
                <div className="step-block">
                  <div className="step-label">3. Fecha y Hora</div>
                  <div className="calendar-wrap">
                    <div className="cal-header">
                      <button className="cal-nav-btn" onClick={() => {
                        if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
                        else setCalMonth(calMonth - 1);
                      }}>‹</button>
                      <div className="cal-title">{MONTHS[calMonth]} {calYear}</div>
                      <button className="cal-nav-btn" onClick={() => {
                        if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
                        else setCalMonth(calMonth + 1);
                      }}>›</button>
                    </div>
                    <div className="cal-grid">{renderCalendar()}</div>
                  </div>

                  <div className="time-grid">
                    {['09:00 AM', '10:30 AM', '12:00 PM', '02:30 PM', '04:00 PM', '05:30 PM'].map((t) => (
                      <div
                        key={t}
                        className={`time-slot${state.time === t ? ' selected' : ''}`}
                        onClick={() => selectTime(t)}
                      >
                        {t}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* SUMMARY SIDEBAR */}
              <div className="summary-sidebar">
                <div className="summary-card">
                  <div className="summary-top-label">Resumen</div>

                  <div className="summary-field">
                    <div className="summary-field-label">Servicio</div>
                    <div className={`summary-field-val${!state.service ? ' placeholder' : ''}`}>
                      {state.service || '—'}
                    </div>
                  </div>

                  <div className="summary-field">
                    <div className="summary-field-label">Profesional</div>
                    <div className={`summary-field-val${!state.pro ? ' placeholder' : ''}`}>
                      {state.pro || '—'}
                    </div>
                  </div>

                  <div className="summary-field">
                    <div className="summary-field-label">Fecha</div>
                    <div className={`summary-field-val${!state.date ? ' placeholder' : ''}`}>
                      {state.date
                        ? `${state.date.d} ${MONTHS[state.date.m]}, ${state.date.y}${state.time ? ` – ${state.time}` : ''}`
                        : '—'}
                    </div>
                  </div>

                  <hr className="summary-divider" />

                  <div className="summary-total-row">
                    <div className="summary-total-lbl">Total</div>
                    <div className="summary-total-amt">
                      {state.servicePrice > 0 ? `S/${state.servicePrice.toFixed(2)}` : 'S/0.00'}
                    </div>
                  </div>

                  <button className="confirm-btn" disabled={!allDone} onClick={goToSuccess}>
                    Confirmar Reserva
                  </button>

                  <div className="cancel-note">
                    Al confirmar, aceptas nuestras políticas de cancelación.
                    Cancelación gratuita hasta 24h antes.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PAGE: SUCCESS */}
      {page === 'success' && (
        <div className="page active">
          <div className="container">
            <div className="success-wrap">
              <div className="success-badge">✨</div>
              <div className="success-title">¡Cita Confirmada!</div>
              <div className="success-sub">
                Tu reserva ha sido registrada exitosamente. Recibirás un
                recordatorio por WhatsApp 24 horas antes de tu cita.
              </div>

              <div className="booking-summary-box">
                <div className="bs-row">
                  <span className="key">Servicio</span>
                  <span className="val">{state.service || '—'}</span>
                </div>
                <div className="bs-row">
                  <span className="key">Profesional</span>
                  <span className="val">{state.pro || '—'}</span>
                </div>
                <div className="bs-row">
                  <span className="key">Fecha y Hora</span>
                  <span className="val">
                    {state.date
                      ? `${state.date.d} ${MONTHS[state.date.m]}, ${state.date.y} · ${state.time || ''}`
                      : '—'}
                  </span>
                </div>
                <div className="bs-row">
                  <span className="key">Total</span>
                  <span className="val" style={{ color: 'var(--gold)' }}>
                    {state.servicePrice > 0 ? `S/${state.servicePrice.toFixed(2)}` : '—'}
                  </span>
                </div>
              </div>

              <button className="success-btn" onClick={resetFlow}>Nueva Reserva</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Booking;
