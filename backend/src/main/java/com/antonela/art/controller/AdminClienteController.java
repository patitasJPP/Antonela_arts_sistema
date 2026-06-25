package com.antonela.art.controller;

import com.antonela.art.repository.CitaRepository;
import com.antonela.art.repository.ClienteRepository;
import com.antonela.art.repository.OrdenCompraRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/clients")
public class AdminClienteController {

    private static final Logger logger = LoggerFactory.getLogger(AdminClienteController.class);

    private final ClienteRepository clienteRepository;
    private final CitaRepository citaRepository;
    private final OrdenCompraRepository ordenCompraRepository;

    public AdminClienteController(ClienteRepository clienteRepository,
                                   CitaRepository citaRepository,
                                   OrdenCompraRepository ordenCompraRepository) {
        this.clienteRepository = clienteRepository;
        this.citaRepository = citaRepository;
        this.ordenCompraRepository = ordenCompraRepository;
    }

    @GetMapping
    public ResponseEntity<?> listAll() {
        try {
            return ResponseEntity.ok(clienteRepository.findAll());
        } catch (Exception e) {
            logger.error("Error al listar clientes", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Error al obtener clientes"));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            var cliente = clienteRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
            return ResponseEntity.ok(cliente);
        } catch (Exception e) {
            logger.error("Error al obtener cliente {}", id, e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/appointments")
    public ResponseEntity<?> getAppointments(@PathVariable Long id) {
        try {
            var citas = citaRepository.findByClienteIdOrderByFechaCitaAscHoraCitaAsc(id);
            return ResponseEntity.ok(citas);
        } catch (Exception e) {
            logger.error("Error al obtener citas del cliente {}", id, e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Error al obtener citas"));
        }
    }

    @GetMapping("/{id}/orders")
    public ResponseEntity<?> getOrders(@PathVariable Long id) {
        try {
            var ordenes = ordenCompraRepository.findByClienteIdOrderByCreadoEnDesc(id);
            return ResponseEntity.ok(ordenes);
        } catch (Exception e) {
            logger.error("Error al obtener ordenes del cliente {}", id, e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Error al obtener ordenes"));
        }
    }
}
