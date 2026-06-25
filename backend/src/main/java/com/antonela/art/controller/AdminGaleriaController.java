package com.antonela.art.controller;

import com.antonela.art.entity.ImagenGaleria;
import com.antonela.art.entity.Servicio;
import com.antonela.art.repository.ImagenGaleriaRepository;
import com.antonela.art.repository.ServicioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/gallery")
public class AdminGaleriaController {

    private static final Logger logger = LoggerFactory.getLogger(AdminGaleriaController.class);

    private final ImagenGaleriaRepository imagenGaleriaRepository;
    private final ServicioRepository servicioRepository;

    public AdminGaleriaController(ImagenGaleriaRepository imagenGaleriaRepository,
                                   ServicioRepository servicioRepository) {
        this.imagenGaleriaRepository = imagenGaleriaRepository;
        this.servicioRepository = servicioRepository;
    }

    @GetMapping
    public ResponseEntity<?> listAll() {
        try {
            return ResponseEntity.ok(imagenGaleriaRepository.findAllByOrderByCategoriaAsc());
        } catch (Exception e) {
            logger.error("Error al listar galeria", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Error al obtener galeria"));
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        try {
            String urlImagen = (String) body.get("urlImagen");
            if (urlImagen == null || urlImagen.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "El campo urlImagen es requerido"));
            }

            ImagenGaleria.ImagenGaleriaBuilder builder = ImagenGaleria.builder()
                    .urlImagen(urlImagen)
                    .categoria((String) body.get("categoria"))
                    .descripcion((String) body.get("descripcion"));

            if (body.get("idServicio") != null) {
                Long idServicio = Long.valueOf(body.get("idServicio").toString());
                Servicio servicio = servicioRepository.findById(idServicio)
                        .orElseThrow(() -> new RuntimeException("Servicio no encontrado"));
                builder.servicio(servicio);
            }

            ImagenGaleria guardado = imagenGaleriaRepository.save(builder.build());
            logger.info("Imagen creada en galeria: {}", guardado.getId());
            return ResponseEntity.ok(guardado);
        } catch (Exception e) {
            logger.error("Error al crear imagen en galeria", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            if (!imagenGaleriaRepository.existsById(id)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Imagen no encontrada"));
            }
            imagenGaleriaRepository.deleteById(id);
            logger.info("Imagen {} eliminada de galeria", id);
            return ResponseEntity.ok(Map.of("mensaje", "Imagen eliminada exitosamente"));
        } catch (Exception e) {
            logger.error("Error al eliminar imagen {}", id, e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
