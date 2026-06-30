package com.antonela.art.controller;

import com.antonela.art.entity.Cita;
import com.antonela.art.entity.Cliente;
import com.antonela.art.entity.Pago;
import com.antonela.art.repository.CitaRepository;
import com.antonela.art.repository.ClienteRepository;
import com.antonela.art.repository.PagoRepository;
import com.antonela.art.service.ServicioPago;
import com.antonela.art.service.StripeService;
import com.stripe.model.checkout.Session;
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
    private final StripeService stripeService;

    public PagoController(ServicioPago servicioPago,
                          CitaRepository citaRepository,
                          ClienteRepository clienteRepository,
                          PagoRepository pagoRepository,
                          StripeService stripeService) {
        this.servicioPago = servicioPago;
        this.citaRepository = citaRepository;
        this.clienteRepository = clienteRepository;
        this.pagoRepository = pagoRepository;
        this.stripeService = stripeService;
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

            Map<String, Object> resultado = servicioPago.procesarPago(cita, cliente, metodoPago);
            logger.info("Pago procesado para cita {}: {}", idCita, resultado);

            return ResponseEntity.status(HttpStatus.CREATED).body(resultado);
        } catch (Exception e) {
            logger.error("Error al procesar pago", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/confirmar-pago")
    public ResponseEntity<?> confirmarPago(@RequestBody Map<String, Object> body) {
        try {
            String sessionId = (String) body.get("sessionId");
            if (sessionId == null || sessionId.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "sessionId requerido"));
            }

            Session session = Session.retrieve(sessionId);
            String clientReferenceId = session.getClientReferenceId();
            String paymentIntent = session.getPaymentIntent();

            if (!"paid".equals(session.getPaymentStatus())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Pago no completado en Stripe"));
            }

            if (clientReferenceId != null && paymentIntent != null) {
                stripeService.procesarPagoExitoso(clientReferenceId, paymentIntent);
            }

            return ResponseEntity.ok(Map.of("mensaje", "Pago confirmado exitosamente"));
        } catch (Exception e) {
            logger.error("Error al confirmar pago", e);
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
