package com.antonela.art.controller;

import com.antonela.art.entity.Cita;
import com.antonela.art.entity.Pago;
import com.antonela.art.entity.Reembolso;
import com.antonela.art.entity.NotificacionAdmin;
import com.antonela.art.repository.CitaRepository;
import com.antonela.art.repository.PagoRepository;
import com.antonela.art.repository.ReembolsoRepository;
import com.antonela.art.repository.NotificacionAdminRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/cancelacion")
public class CancelacionController {

    private static final Logger logger = LoggerFactory.getLogger(CancelacionController.class);

    private final CitaRepository citaRepository;
    private final PagoRepository pagoRepository;
    private final ReembolsoRepository reembolsoRepository;
    private final NotificacionAdminRepository notificacionAdminRepository;

    public CancelacionController(CitaRepository citaRepository,
            PagoRepository pagoRepository,
            ReembolsoRepository reembolsoRepository,
            NotificacionAdminRepository notificacionAdminRepository) {
        this.citaRepository = citaRepository;
        this.pagoRepository = pagoRepository;
        this.reembolsoRepository = reembolsoRepository;
        this.notificacionAdminRepository = notificacionAdminRepository;
    }

    private int calcularPorcentajeReembolso(Cita cita) {
        LocalDateTime fechaHoraCita = LocalDateTime.of(cita.getFechaCita(), cita.getHoraCita());
        LocalDateTime ahora = LocalDateTime.now();

        if (fechaHoraCita.isBefore(ahora)) {
            return 0; // Cita en el pasado
        }

        long horasRestantes = ChronoUnit.HOURS.between(ahora, fechaHoraCita);
        boolean mismoDia = cita.getFechaCita().equals(LocalDate.now());

        if (mismoDia) {
            return 0;
        } else if (horasRestantes < 24) {
            return 50;
        } else {
            return 100;
        }
    }

    @PostMapping("/calculate-refund")
    public ResponseEntity<?> calculateRefund(@RequestBody Map<String, Long> request, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "No autorizado"));
        }
        try {
            Long idCita = request.get("idCita");
            if (idCita == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "El idCita es requerido"));
            }

            Long idCliente = (Long) authentication.getPrincipal();
            Cita cita = citaRepository.findById(idCita)
                    .orElseThrow(() -> new RuntimeException("Cita no encontrada"));

            if (!cita.getCliente().getId().equals(idCliente)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "No tienes permiso para ver esta cita"));
            }

            int porcentaje = calcularPorcentajeReembolso(cita);
            BigDecimal montoOriginal = cita.getMontoPagado() != null ? cita.getMontoPagado()
                    : cita.getServicio().getPrecioMinimo();
            BigDecimal montoReembolso = montoOriginal.multiply(BigDecimal.valueOf(porcentaje))
                    .divide(BigDecimal.valueOf(100));

            return ResponseEntity.ok(Map.of(
                    "porcentajeReembolso", porcentaje,
                    "montoReembolso", montoReembolso,
                    "montoOriginal", montoOriginal));
        } catch (Exception e) {
            logger.error("Error al calcular reembolso", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/cancel-appointment")
    @Transactional
    public ResponseEntity<?> cancelAppointment(@RequestBody Map<String, Long> request, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "No autorizado"));
        }
        try {
            Long idCita = request.get("idCita");
            if (idCita == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "El idCita es requerido"));
            }

            Long idCliente = (Long) authentication.getPrincipal();
            Cita cita = citaRepository.findById(idCita)
                    .orElseThrow(() -> new RuntimeException("Cita no encontrada"));

            if (!cita.getCliente().getId().equals(idCliente)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "No tienes permiso para cancelar esta cita"));
            }

            if ("cancelada".equalsIgnoreCase(cita.getEstado())) {
                return ResponseEntity.badRequest().body(Map.of("error", "La cita ya se encuentra cancelada"));
            }

            int porcentaje = calcularPorcentajeReembolso(cita);
            BigDecimal montoOriginal = cita.getMontoPagado() != null ? cita.getMontoPagado()
                    : cita.getServicio().getPrecioMinimo();
            BigDecimal montoReembolso = montoOriginal.multiply(BigDecimal.valueOf(porcentaje))
                    .divide(BigDecimal.valueOf(100));

            // Actualizar estado de la cita
            cita.setEstado("cancelada");
            citaRepository.save(cita);

            // Obtener o crear Pago
            List<Pago> pagos = pagoRepository.findByCitaId(idCita);
            Pago pago;
            if (pagos.isEmpty()) {
                pago = Pago.builder()
                        .cita(cita)
                        .cliente(cita.getCliente())
                        .metodoPago("simulado_credito")
                        .monto(montoOriginal)
                        .estado("completado")
                        .idTransaccionSimulada("SIM-PAG-" + System.currentTimeMillis())
                        .build();
                pago = pagoRepository.save(pago);
            } else {
                pago = pagos.get(0);
            }

            String idTransaccionSimulada = "SIM-REF-" + System.currentTimeMillis() + "-"
                    + UUID.randomUUID().toString().substring(0, 8);

            // Registrar Reembolso
            Reembolso reembolso = Reembolso.builder()
                    .cita(cita)
                    .pago(pago)
                    .montoReembolsado(montoReembolso)
                    .porcentajeReembolso(porcentaje)
                    .estado("procesado")
                    .idTransaccionSimulada(idTransaccionSimulada)
                    .procesadoEn(LocalDateTime.now())
                    .build();

            reembolsoRepository.save(reembolso);

            // Confirmación en logs (simulado)
            logger.info(
                    "Cancelación exitosa para la cita {}. Reembolso simulado procesado: {} ({}%). Transacción ID: {}",
                    idCita, montoReembolso, porcentaje, idTransaccionSimulada);

            return ResponseEntity.ok(Map.of(
                    "mensaje", "Cancelacion exitosa",
                    "montoReembolsado", montoReembolso,
                    "porcentajeReembolso", porcentaje,
                    "idTransaccion", idTransaccionSimulada));
        } catch (Exception e) {
            logger.error("Error al cancelar cita", e);
            try {
                // Registrar error en NotificacionAdmin si falla
                notificacionAdminRepository.save(NotificacionAdmin.builder()
                        .tipo("ERROR_REEMBOLSO")
                        .mensaje("Error al procesar reembolso para cita " + request.get("idCita") + ": "
                                + e.getMessage())
                        .leida(false)
                        .build());
            } catch (Exception ex) {
                logger.error("Error al registrar notificacion de error al administrador", ex);
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }
}
