package com.antonela.art.service;

import com.antonela.art.entity.Cita;
import com.antonela.art.entity.Cliente;
import com.antonela.art.entity.Pago;
import com.antonela.art.repository.PagoRepository;
import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.checkout.SessionCreateParams;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;

@Service
public class StripeService {

    private final PagoRepository pagoRepository;

    @Value("${stripe.secret-key}")
    private String secretKey;

    @Value("${stripe.webhook-secret}")
    private String webhookSecret;

    @Value("${stripe.success-url}")
    private String successUrl;

    @Value("${stripe.cancel-url}")
    private String cancelUrl;

    public StripeService(PagoRepository pagoRepository) {
        this.pagoRepository = pagoRepository;
    }

    @PostConstruct
    public void init() {
        Stripe.apiKey = secretKey;
    }

    public String crearSesionCheckout(Cita cita, Cliente cliente) {
        BigDecimal montoEnCentavos = (cita.getMontoPagado() != null
                ? cita.getMontoPagado()
                : cita.getServicio().getPrecioMinimo())
                .multiply(BigDecimal.valueOf(100));

        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(successUrl + "?session_id={CHECKOUT_SESSION_ID}")
                .setCancelUrl(cancelUrl)
                .addLineItem(
                        SessionCreateParams.LineItem.builder()
                                .setQuantity(1L)
                                .setPriceData(
                                        SessionCreateParams.LineItem.PriceData.builder()
                                                .setCurrency("pen")
                                                .setUnitAmount(montoEnCentavos.longValue())
                                                .setProductData(
                                                        SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                .setName("Cita: " + cita.getServicio().getNombre())
                                                                .build())
                                                .build())
                                .build())
                .putMetadata("id_cita", cita.getId().toString())
                .putMetadata("id_cliente", cliente.getId().toString())
                .build();

        try {
            Session session = Session.create(params);
            Pago pago = Pago.builder()
                    .cita(cita)
                    .cliente(cliente)
                    .metodoPago("stripe")
                    .monto(cita.getMontoPagado() != null ? cita.getMontoPagado()
                            : cita.getServicio().getPrecioMinimo())
                    .estado("pendiente")
                    .stripeSessionId(session.getId())
                    .idTransaccionSimulada("STRIPE-" + Instant.now().getEpochSecond())
                    .build();
            pagoRepository.save(pago);
            return session.getUrl();
        } catch (Exception e) {
            throw new RuntimeException("Error al crear sesion de Stripe: " + e.getMessage(), e);
        }
    }

    @Transactional
    public void confirmarPago(String sessionId) {
        Pago pago = pagoRepository.findByStripeSessionId(sessionId)
                .orElseThrow(() -> new RuntimeException("Pago no encontrado para session: " + sessionId));
        if (!"pendiente".equals(pago.getEstado())) {
            return;
        }
        try {
            Session session = Session.retrieve(sessionId);
            pago.setStripePaymentIntentId(session.getPaymentIntent());
            pago.setEstado("completado");
            pagoRepository.save(pago);
        } catch (Exception e) {
            throw new RuntimeException("Error al confirmar pago Stripe: " + e.getMessage(), e);
        }
    }

    public Event construirEventoWebhook(String payload, String sigHeader) {
        try {
            return Webhook.constructEvent(payload, sigHeader, webhookSecret);
        } catch (SignatureVerificationException e) {
            throw new RuntimeException("Firma de webhook invalida", e);
        }
    }
}
