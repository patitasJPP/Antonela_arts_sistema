package com.antonela.art.controller;

import com.antonela.art.entity.Cita;
import com.antonela.art.entity.Cliente;
import com.antonela.art.entity.Pago;
import com.antonela.art.repository.CitaRepository;
import com.antonela.art.repository.ClienteRepository;
import com.antonela.art.repository.PagoRepository;
import com.antonela.art.service.ServicioPago;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payment")
public class PagoController {

    private static final Logger logger = LoggerFactory.getLogger(PagoController.class);

    private final ServicioPago servicioPago;
    private final CitaRepository citaRepository;
    private final ClienteRepository clienteRepository;
    private final PagoRepository pagoRepository;

    public PagoController(ServicioPago servicioPago,
                          CitaRepository citaRepository,
                          ClienteRepository clienteRepository,
                          PagoRepository pagoRepository) {
        this.servicioPago = servicioPago;
        this.citaRepository = citaRepository;
        this.clienteRepository = clienteRepository;
        this.pagoRepository = pagoRepository;
    }

    @PostMapping("/process")
    public ResponseEntity<?> processPayment(@RequestBody Map<String, Object> request, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "No autorizado"));
        }
        try {
            Long idCliente = (Long) authentication.getPrincipal();
            Long idCita = Long.valueOf(request.get("idCita").toString());
            String metodoPago = (String) request.get("metodoPago");

            Cliente cliente = clienteRepository.findById(idCliente)
                    .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

            Cita cita = citaRepository.findById(idCita)
                    .orElseThrow(() -> new RuntimeException("Cita no encontrada"));

            if (!cita.getCliente().getId().equals(idCliente)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "No tienes permiso para pagar esta cita"));
            }

            Pago pago = servicioPago.procesarPago(cita, cliente, metodoPago);
            logger.info("Pago procesado para cita {}: transaccion {}", idCita, pago.getIdTransaccionSimulada());

            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "idPago", pago.getId(),
                    "idTransaccion", pago.getIdTransaccionSimulada(),
                    "monto", pago.getMonto(),
                    "estado", pago.getEstado(),
                    "metodoPago", pago.getMetodoPago()));
        } catch (Exception e) {
            logger.error("Error al procesar pago", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/history")
    public ResponseEntity<?> getPaymentHistory(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "No autorizado"));
        }
        try {
            Long idCliente = (Long) authentication.getPrincipal();
            List<Pago> pagos = pagoRepository.findByClienteIdOrderByCreadoEnDesc(idCliente);
            return ResponseEntity.ok(pagos);
        } catch (Exception e) {
            logger.error("Error al obtener historial de pagos", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }
}
