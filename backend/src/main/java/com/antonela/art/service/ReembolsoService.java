package com.antonela.art.service;

import com.antonela.art.entity.Cita;
import com.antonela.art.entity.NotificacionAdmin;
import com.antonela.art.entity.Pago;
import com.antonela.art.entity.Reembolso;
import com.antonela.art.repository.NotificacionAdminRepository;
import com.antonela.art.repository.ReembolsoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Service
public class ReembolsoService {

    private static final Logger logger = LoggerFactory.getLogger(ReembolsoService.class);

    private final ReembolsoRepository reembolsoRepository;
    private final NotificacionAdminRepository notificacionAdminRepository;
    private final StripeService stripeService;
    private final NotificacionService notificacionService;

    public ReembolsoService(ReembolsoRepository reembolsoRepository,
                            NotificacionAdminRepository notificacionAdminRepository,
                            StripeService stripeService,
                            NotificacionService notificacionService) {
        this.reembolsoRepository = reembolsoRepository;
        this.notificacionAdminRepository = notificacionAdminRepository;
        this.stripeService = stripeService;
        this.notificacionService = notificacionService;
    }

    @Transactional
    public Reembolso procesarReembolso(Pago pago, BigDecimal monto, int porcentaje) {
        try {
            String refId;
            boolean esStripe = "stripe".equals(pago.getMetodoPago());

            if (esStripe) {
                String stripeRefundId = stripeService.procesarReembolsoStripe(pago, monto);
                refId = stripeRefundId;
            } else {
                String timestamp = String.valueOf(Instant.now().getEpochSecond());
                String randomSuffix = UUID.randomUUID().toString().substring(0, 8);
                refId = "SIM-REF-" + timestamp + "-" + randomSuffix;
            }

            Reembolso reembolso = Reembolso.builder()
                    .cita(pago.getCita())
                    .pago(pago)
                    .montoReembolsado(monto)
                    .porcentajeReembolso(porcentaje)
                    .estado("procesado")
                    .idTransaccionSimulada(refId)
                    .procesadoEn(LocalDateTime.now())
                    .build();

            Reembolso guardado = reembolsoRepository.save(reembolso);
            logger.info("Reembolso procesado: {} para pago {}", refId, pago.getId());

            Cita cita = pago.getCita();
            CompletableFuture.runAsync(() -> {
                try {
                    notificacionService.enviarCancelacionConReembolso(
                            cita,
                            "Cancelación procesada",
                            monto,
                            BigDecimal.valueOf(porcentaje));
                    logger.info("Notificacion de reembolso enviada para cita {}", cita.getId());
                } catch (Exception e) {
                    logger.error("Error al enviar notificacion de reembolso: {}", e.getMessage());
                }
            });

            return guardado;
        } catch (Exception e) {
            logger.error("Error al procesar reembolso para pago {}", pago.getId(), e);
            notificacionAdminRepository.save(NotificacionAdmin.builder()
                    .tipo("ERROR_REEMBOLSO")
                    .mensaje("Error al procesar reembolso para pago " + pago.getId() + ": " + e.getMessage())
                    .leida(false)
                    .build());
            throw new RuntimeException("Error al procesar reembolso: " + e.getMessage());
        }
    }
}
