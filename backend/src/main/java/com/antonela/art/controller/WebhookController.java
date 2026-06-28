package com.antonela.art.controller;

import com.antonela.art.service.StripeService;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/webhook")
public class WebhookController {

    private static final Logger logger = LoggerFactory.getLogger(WebhookController.class);

    private final StripeService stripeService;

    public WebhookController(StripeService stripeService) {
        this.stripeService = stripeService;
    }

    @PostMapping("/stripe")
    public ResponseEntity<String> handleStripeWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {
        try {
            Event event = stripeService.construirEventoWebhook(payload, sigHeader);
            switch (event.getType()) {
                case "checkout.session.completed" -> {
                    Session session = (Session) event.getDataObjectDeserializer()
                            .getObject()
                            .orElseThrow(() -> new RuntimeException("No se pudo deserializar la sesion"));
                    stripeService.confirmarPago(session.getId());
                    logger.info("Pago completado para session: {}", session.getId());
                }
                case "checkout.session.expired" -> {
                    Session session = (Session) event.getDataObjectDeserializer()
                            .getObject()
                            .orElseThrow(() -> new RuntimeException("No se pudo deserializar la sesion"));
                    logger.warn("Sesion expirada: {}", session.getId());
                }
                default -> logger.debug("Evento no manejado: {}", event.getType());
            }
            return ResponseEntity.ok("OK");
        } catch (Exception e) {
            logger.error("Error procesando webhook Stripe", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}
