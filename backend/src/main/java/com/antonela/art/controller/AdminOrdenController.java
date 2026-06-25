package com.antonela.art.controller;

import com.antonela.art.repository.OrdenCompraRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/orders")
public class AdminOrdenController {

    private static final Logger logger = LoggerFactory.getLogger(AdminOrdenController.class);

    private final OrdenCompraRepository ordenCompraRepository;

    public AdminOrdenController(OrdenCompraRepository ordenCompraRepository) {
        this.ordenCompraRepository = ordenCompraRepository;
    }

    @GetMapping
    public ResponseEntity<?> listAll() {
        try {
            var ordenes = ordenCompraRepository.findAll(Sort.by(Sort.Direction.DESC, "creadoEn"));
            return ResponseEntity.ok(ordenes);
        } catch (Exception e) {
            logger.error("Error al listar ordenes", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Error al obtener ordenes"));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            var orden = ordenCompraRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Orden no encontrada"));

            String nuevoEstado = body.get("estado");
            if (nuevoEstado == null || nuevoEstado.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "El campo estado es requerido"));
            }
            if (!nuevoEstado.equals("pendiente") && !nuevoEstado.equals("completada") && !nuevoEstado.equals("cancelada")) {
                return ResponseEntity.badRequest().body(Map.of("error", "Estado invalido. Use: pendiente, completada o cancelada"));
            }

            orden.setEstado(nuevoEstado);
            ordenCompraRepository.save(orden);
            logger.info("Orden {} actualizada a estado: {}", id, nuevoEstado);
            return ResponseEntity.ok(Map.of("mensaje", "Estado actualizado exitosamente"));
        } catch (Exception e) {
            logger.error("Error al actualizar estado de orden {}", id, e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
