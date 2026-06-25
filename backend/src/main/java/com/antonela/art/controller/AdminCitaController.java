package com.antonela.art.controller;

import com.antonela.art.entity.Cita;
import com.antonela.art.entity.NotificacionAdmin;
import com.antonela.art.repository.CitaRepository;
import com.antonela.art.repository.NotificacionAdminRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/appointments")
public class AdminCitaController {

    private static final Logger logger = LoggerFactory.getLogger(AdminCitaController.class);

    private final CitaRepository citaRepository;
    private final NotificacionAdminRepository notificacionAdminRepository;

    public AdminCitaController(CitaRepository citaRepository,
                                NotificacionAdminRepository notificacionAdminRepository) {
        this.citaRepository = citaRepository;
        this.notificacionAdminRepository = notificacionAdminRepository;
    }

    @GetMapping
    public ResponseEntity<?> listAll(
            @RequestParam(value = "desde", required = false) LocalDate desde,
            @RequestParam(value = "hasta", required = false) LocalDate hasta) {
        try {
            List<Cita> citas;
            if (desde != null && hasta != null) {
                citas = citaRepository.findByFechaCitaBetweenOrderByFechaCitaAscHoraCitaAsc(desde, hasta);
            } else {
                citas = citaRepository.findAll();
            }
            return ResponseEntity.ok(citas);
        } catch (Exception e) {
            logger.error("Error al listar citas", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Error al obtener citas"));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            var cita = citaRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Cita no encontrada"));
            return ResponseEntity.ok(cita);
        } catch (Exception e) {
            logger.error("Error al obtener cita {}", id, e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            Cita cita = citaRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Cita no encontrada"));

            String nuevoEstado = body.get("estado");
            if (nuevoEstado == null || nuevoEstado.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "El campo estado es requerido"));
            }

            cita.setEstado(nuevoEstado);
            citaRepository.save(cita);
            logger.info("Cita {} actualizada a estado: {}", id, nuevoEstado);

            if ("cancelada".equalsIgnoreCase(nuevoEstado) || "confirmada".equalsIgnoreCase(nuevoEstado)) {
                String mensaje = "cita".equalsIgnoreCase(nuevoEstado)
                        ? "Cita #" + id + " ha sido " + nuevoEstado
                        : "Cita #" + id + " ha sido " + nuevoEstado;
                notificacionAdminRepository.save(NotificacionAdmin.builder()
                        .tipo("ESTADO_CITA")
                        .mensaje(mensaje)
                        .leida(false)
                        .build());
                logger.info("Notificacion creada para cita {}: {}", id, mensaje);
            }

            return ResponseEntity.ok(Map.of("mensaje", "Estado actualizado exitosamente"));
        } catch (Exception e) {
            logger.error("Error al actualizar estado de cita {}", id, e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/reschedule")
    public ResponseEntity<?> reschedule(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            Cita cita = citaRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Cita no encontrada"));

            String nuevaFechaStr = body.get("fecha");
            String nuevaHoraStr = body.get("hora");
            if (nuevaFechaStr == null || nuevaHoraStr == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Los campos fecha y hora son requeridos"));
            }

            LocalDate nuevaFecha = LocalDate.parse(nuevaFechaStr);
            LocalTime nuevaHora = LocalTime.parse(nuevaHoraStr);

            var conflicto = citaRepository.findByFechaCitaAndHoraCitaAndIdNot(nuevaFecha, nuevaHora, id);
            if (conflicto.isPresent()) {
                return ResponseEntity.status(409).body(Map.of("error", "La franja horaria no esta disponible"));
            }

            cita.setFechaCita(nuevaFecha);
            cita.setHoraCita(nuevaHora);
            citaRepository.save(cita);

            notificacionAdminRepository.save(NotificacionAdmin.builder()
                    .tipo("REPROGRAMACION")
                    .mensaje("Cita #" + id + " reprogramada para " + nuevaFechaStr + " " + nuevaHoraStr)
                    .leida(false)
                    .build());

            logger.info("Cita {} reprogramada para {} {}", id, nuevaFecha, nuevaHora);
            return ResponseEntity.ok(Map.of("mensaje", "Cita reprogramada exitosamente"));
        } catch (Exception e) {
            logger.error("Error al reprogramar cita {}", id, e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
