package com.antonela.art.controller;

import com.antonela.art.entity.Producto;
import com.antonela.art.repository.ProductoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/products")
public class AdminProductoController {

    private static final Logger logger = LoggerFactory.getLogger(AdminProductoController.class);

    private final ProductoRepository productoRepository;

    public AdminProductoController(ProductoRepository productoRepository) {
        this.productoRepository = productoRepository;
    }

    @GetMapping
    public ResponseEntity<?> listAll() {
        try {
            return ResponseEntity.ok(productoRepository.findAll());
        } catch (Exception e) {
            logger.error("Error al listar productos", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Error al obtener productos"));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            var producto = productoRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
            return ResponseEntity.ok(producto);
        } catch (Exception e) {
            logger.error("Error al obtener producto {}", id, e);
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

            Producto producto = Producto.builder()
                    .nombre(nombre)
                    .descripcion((String) body.get("descripcion"))
                    .precio(new BigDecimal(body.get("precio").toString()))
                    .urlImagen((String) body.get("urlImagen"))
                    .disponible(body.get("disponible") != null ? Boolean.valueOf(body.get("disponible").toString()) : true)
                    .build();

            Producto guardado = productoRepository.save(producto);
            logger.info("Producto creado: {}", guardado.getNombre());
            return ResponseEntity.ok(guardado);
        } catch (Exception e) {
            logger.error("Error al crear producto", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            Producto producto = productoRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

            if (body.containsKey("nombre")) {
                producto.setNombre((String) body.get("nombre"));
            }
            if (body.containsKey("descripcion")) {
                producto.setDescripcion((String) body.get("descripcion"));
            }
            if (body.containsKey("precio")) {
                producto.setPrecio(new BigDecimal(body.get("precio").toString()));
            }
            if (body.containsKey("urlImagen")) {
                producto.setUrlImagen((String) body.get("urlImagen"));
            }
            if (body.containsKey("disponible")) {
                producto.setDisponible(Boolean.valueOf(body.get("disponible").toString()));
            }

            productoRepository.save(producto);
            logger.info("Producto {} actualizado", id);
            return ResponseEntity.ok(producto);
        } catch (Exception e) {
            logger.error("Error al actualizar producto {}", id, e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/disponible")
    public ResponseEntity<?> toggleDisponible(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            Producto producto = productoRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

            if (body.get("disponible") == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "El campo disponible es requerido"));
            }

            producto.setDisponible(Boolean.valueOf(body.get("disponible").toString()));
            productoRepository.save(producto);
            logger.info("Disponibilidad del producto {} actualizada a {}", id, producto.getDisponible());
            return ResponseEntity.ok(Map.of("mensaje", "Disponibilidad actualizada", "disponible", producto.getDisponible()));
        } catch (Exception e) {
            logger.error("Error al cambiar disponibilidad del producto {}", id, e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            if (!productoRepository.existsById(id)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Producto no encontrado"));
            }
            productoRepository.deleteById(id);
            logger.info("Producto {} eliminado", id);
            return ResponseEntity.ok(Map.of("mensaje", "Producto eliminado exitosamente"));
        } catch (Exception e) {
            logger.error("Error al eliminar producto {}", id, e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
