package com.antonela.art.controller;

import com.antonela.art.repository.NotificacionAdminRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/dashboard")
public class AdminDashboardController {

    private static final Logger logger = LoggerFactory.getLogger(AdminDashboardController.class);

    @PersistenceContext
    private EntityManager entityManager;

    private final NotificacionAdminRepository notificacionAdminRepository;

    public AdminDashboardController(NotificacionAdminRepository notificacionAdminRepository) {
        this.notificacionAdminRepository = notificacionAdminRepository;
    }

    @GetMapping
    public ResponseEntity<?> getDashboard() {
        try {
            Long citasHoy = (Long) entityManager
                    .createQuery("SELECT COUNT(c) FROM Cita c WHERE c.fechaCita = :hoy")
                    .setParameter("hoy", LocalDate.now())
                    .getSingleResult();

            Long totalClientes = (Long) entityManager
                    .createQuery("SELECT COUNT(c) FROM Cliente c")
                    .getSingleResult();

            Long productosActivos = (Long) entityManager
                    .createQuery("SELECT COUNT(p) FROM Producto p WHERE p.disponible = true")
                    .getSingleResult();

            Long totalOrdenes = (Long) entityManager
                    .createQuery("SELECT COUNT(o) FROM OrdenCompra o")
                    .getSingleResult();

            return ResponseEntity.ok(Map.of(
                    "citasHoy", citasHoy,
                    "totalClientes", totalClientes,
                    "productosActivos", productosActivos,
                    "totalOrdenes", totalOrdenes));
        } catch (Exception e) {
            logger.error("Error al obtener dashboard", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Error al obtener estadisticas"));
        }
    }

    @GetMapping("/notifications")
    public ResponseEntity<?> getNotifications() {
        try {
            return ResponseEntity.ok(notificacionAdminRepository.findAllByOrderByCreadoEnDesc());
        } catch (Exception e) {
            logger.error("Error al obtener notificaciones", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Error al obtener notificaciones"));
        }
    }

    @PostMapping("/notifications/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        try {
            var notif = notificacionAdminRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Notificacion no encontrada"));
            notif.setLeida(true);
            notificacionAdminRepository.save(notif);
            return ResponseEntity.ok(Map.of("mensaje", "Notificacion marcada como leida"));
        } catch (Exception e) {
            logger.error("Error al marcar notificacion como leida", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
