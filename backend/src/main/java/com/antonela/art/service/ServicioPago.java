package com.antonela.art.service;

import com.antonela.art.entity.Cita;
import com.antonela.art.entity.Cliente;
import com.antonela.art.entity.Pago;
import com.antonela.art.repository.PagoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
public class ServicioPago {

    private final PagoRepository pagoRepository;
    private final StripeService stripeService;

    public ServicioPago(PagoRepository pagoRepository, StripeService stripeService) {
        this.pagoRepository = pagoRepository;
        this.stripeService = stripeService;
    }

    @Transactional
    public Map<String, Object> procesarPago(Cita cita, Cliente cliente, String metodoPago) {
        if ("efectivo".equals(metodoPago)) {
            Pago pago = Pago.builder()
                    .cita(cita)
                    .cliente(cliente)
                    .metodoPago("efectivo")
                    .monto(cita.getMontoPagado() != null ? cita.getMontoPagado()
                            : cita.getServicio().getPrecioMinimo())
                    .estado("completado")
                    .build();
            pagoRepository.save(pago);
            return Map.of(
                    "idPago", pago.getId(),
                    "estado", pago.getEstado(),
                    "monto", pago.getMonto(),
                    "metodoPago", "efectivo");
        }

        if ("stripe".equals(metodoPago)) {
            String checkoutUrl = stripeService.crearSesionCheckout(cita, cliente);
            return Map.of(
                    "checkoutUrl", checkoutUrl,
                    "estado", "pendiente");
        }

        throw new IllegalArgumentException("Metodo de pago no valido: " + metodoPago);
    }
}
