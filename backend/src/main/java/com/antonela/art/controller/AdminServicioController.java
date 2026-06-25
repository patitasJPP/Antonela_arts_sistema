package com.antonela.art.controller;

import com.antonela.art.entity.Servicio;
import com.antonela.art.repository.ServicioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/services")
public class AdminServicioController {

    private static final Logger logger = LoggerFactory.getLogger(AdminServicioController.class);

    private final ServicioRepository servicioRepository;

    public AdminServicioController(ServicioRepository servicioRepository) {
        this.servicioRepository = servicioRepository;
    }

    @GetMapping
    public ResponseEntity<?> listAll() {
        try {
            return ResponseEntity.ok(servicioRepository.findAll());
        } catch (Exception e) {
            logger.error("Error al listar servicios", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Error al obtener servicios"));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            var servicio = servicioRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Servicio no encontrado"));
            return ResponseEntity.ok(servicio);
        } catch (Exception e) {
            logger.error("Error al obtener servicio {}", id, e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        try {
            String nombre = (String) body.get("nombre");
            if (nombre == null || nombre.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "El campo nombre es requerido"));
            }

            Servicio servicio = Servicio.builder()
                    .nombre(nombre)
                    .descripcion((String) body.get("descripcion"))
                    .precioMinimo(new BigDecimal(body.get("precioMinimo").toString()))
                    .precioMaximo(body.get("precioMaximo") != null ? new BigDecimal(body.get("precioMaximo").toString()) : null)
                    .build();

            Servicio guardado = servicioRepository.save(servicio);
            logger.info("Servicio creado: {}", guardado.getNombre());
            return ResponseEntity.ok(guardado);
        } catch (Exception e) {
            logger.error("Error al crear servicio", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            Servicio servicio = servicioRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Servicio no encontrado"));

            if (body.containsKey("nombre")) {
                servicio.setNombre((String) body.get("nombre"));
            }
            if (body.containsKey("descripcion")) {
                servicio.setDescripcion((String) body.get("descripcion"));
            }
            if (body.containsKey("precioMinimo")) {
                servicio.setPrecioMinimo(new BigDecimal(body.get("precioMinimo").toString()));
            }
            if (body.containsKey("precioMaximo")) {
                servicio.setPrecioMaximo(body.get("precioMaximo") != null ? new BigDecimal(body.get("precioMaximo").toString()) : null);
            }

            servicioRepository.save(servicio);
            logger.info("Servicio {} actualizado", id);
            return ResponseEntity.ok(servicio);
        } catch (Exception e) {
            logger.error("Error al actualizar servicio {}", id, e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            if (!servicioRepository.existsById(id)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Servicio no encontrado"));
            }
            servicioRepository.deleteById(id);
            logger.info("Servicio {} eliminado", id);
            return ResponseEntity.ok(Map.of("mensaje", "Servicio eliminado exitosamente"));
        } catch (Exception e) {
            logger.error("Error al eliminar servicio {}", id, e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
