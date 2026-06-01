import React from 'react';

interface PoliticaCancelacionProps {
  aceptado: boolean;
  onAceptarChange: (aceptado: boolean) => void;
  mostrarCheckbox?: boolean;
}

export const PoliticaCancelacion: React.FC<PoliticaCancelacionProps> = ({
  aceptado,
  onAceptarChange,
  mostrarCheckbox = true
}) => {
  return (
    <div className="politica-cancelacion-box" style={{
      background: 'rgba(184, 150, 46, 0.05)',
      border: '1px solid rgba(184, 150, 46, 0.2)',
      borderRadius: '12px',
      padding: '20px',
      marginTop: '20px',
      fontFamily: '"DM Sans", sans-serif'
    }}>
      <h3 style={{
        fontFamily: '"Cormorant Garamond", serif',
        fontSize: '20px',
        color: 'var(--dark)',
        marginBottom: '12px',
        fontWeight: 600,
        letterSpacing: '0.02em'
      }}>
        Política de Cancelación y Reembolsos
      </h3>
      
      <ul style={{
        paddingLeft: '20px',
        fontSize: '13px',
        color: 'var(--text)',
        lineHeight: '1.8',
        marginBottom: '16px',
        listStyleType: 'disc'
      }}>
        <li>
          <strong>Cancelación con 24 horas o más de anticipación:</strong> Reembolso del <strong>100%</strong> de lo abonado.
        </li>
        <li>
          <strong>Cancelación con menos de 24 horas de anticipación:</strong> Reembolso del <strong>50%</strong> del monto total.
        </li>
        <li>
          <strong>Cancelación el mismo día o inasistencia (No-show):</strong> Reembolso del <strong>0%</strong>. No califica para devoluciones.
        </li>
      </ul>
      
      {mostrarCheckbox && (
        <label className="checkbox-label" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 500,
          color: aceptado ? 'var(--dark)' : 'var(--muted)',
          transition: 'color 0.2s'
        }}>
          <div
            onClick={() => onAceptarChange(!aceptado)}
            style={{
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              border: `2px solid ${aceptado ? 'var(--gold)' : 'rgba(184,150,46,0.3)'}`,
              backgroundColor: aceptado ? 'var(--gold)' : 'transparent',
              color: '#fff',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              flexShrink: 0
            }}
          >
            {aceptado && <i className="bi bi-check-lg"></i>}
          </div>
          <span onClick={() => onAceptarChange(!aceptado)}>Acepto los términos y la política de cancelación de citas</span>
        </label>
      )}
    </div>
  );
};

export default PoliticaCancelacion;
