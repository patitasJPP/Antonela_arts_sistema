package com.antonela.art.service;

import com.antonela.art.entity.Cita;
import com.antonela.art.entity.Cliente;
import com.antonela.art.entity.OrdenCompra;
import com.antonela.art.entity.Pago;
import com.antonela.art.repository.CitaRepository;
import com.antonela.art.repository.OrdenCompraRepository;
import com.antonela.art.repository.PagoRepository;
import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.Refund;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.RefundCreateParams;
import com.stripe.param.checkout.SessionCreateParams;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
public class StripeService {

    private static final Logger logger = LoggerFactory.getLogger(StripeService.class);

    private final PagoRepository pagoRepository;
    private final OrdenCompraRepository ordenRepository;
    private final CitaRepository citaRepository;
    private final NotificacionService notificacionService;

    @Value("${stripe.secret-key}")
    private String secretKey;

    @Value("${stripe.webhook-secret}")
    private String webhookSecret;

    @Value("${stripe.success-url}")
    private String successUrl;

    @Value("${stripe.cancel-url}")
    private String cancelUrl;

    @Value("${app.frontend-url:${stripe.success-url}}")
    private String frontendUrl;

    private boolean stripeInicializado = false;

    public StripeService(PagoRepository pagoRepository,
                         OrdenCompraRepository ordenRepository,
                         CitaRepository citaRepository,
                         NotificacionService notificacionService) {
        this.pagoRepository = pagoRepository;
        this.ordenRepository = ordenRepository;
        this.citaRepository = citaRepository;
        this.notificacionService = notificacionService;
    }

    @PostConstruct
    public void init() {
        if (secretKey != null && !secretKey.isEmpty() && !secretKey.equals("sk_test_TU_SECRET_KEY_AQUI")) {
            Stripe.apiKey = secretKey;
            stripeInicializado = true;
            logger.info("Stripe inicializado correctamente");
        } else {
            logger.warn("Stripe no configurado - usa credenciales de prueba en application.properties");
        }
    }

    public Session crearSesionProductos(Cliente cliente, List<Map<String, Object>> items, BigDecimal total, Long ordenId) {
        if (!stripeInicializado) {
            throw new RuntimeException("Stripe no esta configurado. Configura stripe.secret-key en application.properties");
        }

        SessionCreateParams.LineItem[] lineItems = items.stream().map(item -> {
            String nombre = (String) item.get("nombre");
            BigDecimal precio = BigDecimal.valueOf(((Number) item.get("precio")).doubleValue());
            int cantidad = ((Number) item.get("cantidad")).intValue();

            return SessionCreateParams.LineItem.builder()
                    .setQuantity((long) cantidad)
                    .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                            .setCurrency("pen")
                            .setUnitAmount(precio.multiply(BigDecimal.valueOf(100)).longValue())
                            .setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                    .setName(nombre)
                                    .build())
                            .build())
                    .build();
        }).toArray(SessionCreateParams.LineItem[]::new);

        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(frontendUrl + "/shop/confirmacion?status=success&session_id={CHECKOUT_SESSION_ID}")
                .setCancelUrl(frontendUrl + "/shop/confirmacion?status=canceled")
                .setCustomerEmail(cliente.getCorreoElectronico())
                .setClientReferenceId(String.valueOf(ordenId))
                .addAllLineItem(List.of(lineItems))
                .build();

        try {
            Session session = Session.create(params);
            logger.info("Sesion Stripe creada: {} para orden {}", session.getId(), ordenId);
            return session;
        } catch (Exception e) {
            throw new RuntimeException("Error al crear sesion de Stripe: " + e.getMessage(), e);
        }
    }

    public String crearSesionCheckout(Cita cita, Cliente cliente) {
        BigDecimal montoEnCentavos = (cita.getMontoPagado() != null
                ? cita.getMontoPagado()
                : cita.getServicio().getPrecioMinimo())
                .multiply(BigDecimal.valueOf(100));

        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(frontendUrl + "/shop/confirmacion?status=success&type=cita&citaId=" + cita.getId() + "&session_id={CHECKOUT_SESSION_ID}")
                .setCancelUrl(frontendUrl + "/shop/confirmacion?status=canceled&type=cita")
                .setClientReferenceId("cita_" + cita.getId())
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

    public void procesarPagoExitoso(String clientReferenceId, String paymentIntentId) {
        if (clientReferenceId == null) return;

        if (clientReferenceId.startsWith("cita_")) {
            Long citaId = Long.parseLong(clientReferenceId.replace("cita_", ""));
            citaRepository.findById(citaId).ifPresent(cita -> {
                cita.setEstado("confirmada");
                citaRepository.save(cita);

                List<Pago> pagos = pagoRepository.findByCitaId(citaId);
                Pago pago;
                if (pagos.isEmpty()) {
                    pago = Pago.builder()
                            .cita(cita)
                            .cliente(cita.getCliente())
                            .metodoPago("stripe")
                            .monto(cita.getMontoPagado() != null ? cita.getMontoPagado()
                                    : cita.getServicio().getPrecioMinimo())
                            .estado("completado")
                            .stripeSessionId(null)
                            .idTransaccionSimulada(paymentIntentId)
                            .build();
                } else {
                    pago = pagos.get(0);
                    pago.setEstado("completado");
                }
                pago.setIdTransaccionSimulada(paymentIntentId);
                pagoRepository.save(pago);
                logger.info("Pago Stripe confirmado para cita {}: paymentIntent={}", citaId, paymentIntentId);

                try {
                    notificacionService.enviarConfirmacionCita(cita);
                } catch (Exception e) {
                    logger.error("Error al enviar notificacion de confirmacion {}: {}", citaId, e.getMessage());
                }
            });
        } else {
            Long ordenId = Long.parseLong(clientReferenceId);
            ordenRepository.findById(ordenId).ifPresent(orden -> {
                orden.setEstado("completada");
                orden.setIdTransaccionSimulada(paymentIntentId);
                ordenRepository.save(orden);
                logger.info("Pago Stripe registrado para orden {}: paymentIntent={}", ordenId, paymentIntentId);

                try {
                    notificacionService.enviarConfirmacionPedido(orden);
                } catch (Exception e) {
                    logger.error("Error al enviar notificacion de orden {}: {}", ordenId, e.getMessage());
                }
            });
        }
    }

    @Transactional
    public String confirmarOrdenPorSession(String sessionId) {
        try {
            Session session = Session.retrieve(sessionId);
            String clientReferenceId = session.getClientReferenceId();
            String paymentIntent = session.getPaymentIntent();
            if (clientReferenceId == null) {
                return "Sin referencia de orden";
            }
            if ("paid".equals(session.getPaymentStatus())) {
                procesarPagoExitoso(clientReferenceId, paymentIntent != null ? paymentIntent : sessionId);
                return "Orden confirmada: " + clientReferenceId;
            }
            return "Pago no completado";
        } catch (Exception e) {
            throw new RuntimeException("Error al confirmar orden: " + e.getMessage(), e);
        }
    }

    public String procesarReembolsoStripe(Pago pago, BigDecimal monto) {
        if (!stripeInicializado) {
            throw new RuntimeException("Stripe no esta configurado");
        }
        String paymentIntent = pago.getStripePaymentIntentId();
        if (paymentIntent == null || paymentIntent.isBlank()) {
            paymentIntent = pago.getIdTransaccionSimulada();
        }
        if (paymentIntent == null || paymentIntent.isBlank()) {
            throw new RuntimeException("Pago no tiene referencia de Stripe para reembolsar");
        }

        try {
            long centavos = monto.multiply(BigDecimal.valueOf(100)).longValue();

            RefundCreateParams params = RefundCreateParams.builder()
                    .setPaymentIntent(paymentIntent)
                    .setAmount(centavos)
                    .build();

            Refund refund = Refund.create(params);
            logger.info("Reembolso Stripe creado: {} para paymentIntent={}, monto={}", refund.getId(), paymentIntent, monto);
            return refund.getId();
        } catch (StripeException e) {
            logger.error("Error al reembolsar en Stripe: {}", e.getMessage());
            throw new RuntimeException("Error al procesar reembolso en Stripe: " + e.getMessage(), e);
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
