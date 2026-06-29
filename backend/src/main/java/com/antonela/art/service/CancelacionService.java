package com.antonela.art.service;

import com.antonela.art.entity.Cita;
import com.antonela.art.repository.CitaRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Service
public class CancelacionService {

    private final CitaRepository citaRepository;
    private final NotificacionService notificacionService;

    public CancelacionService(CitaRepository citaRepository, NotificacionService notificacionService) {
        this.citaRepository = citaRepository;
        this.notificacionService = notificacionService;
    }

    public int calcularPorcentajeReembolso(Cita cita) {
        LocalDateTime fechaHoraCita = LocalDateTime.of(cita.getFechaCita(), cita.getHoraCita());
        LocalDateTime ahora = LocalDateTime.now();

        if (fechaHoraCita.isBefore(ahora)) {
            return 0;
        }

        long horasRestantes = ChronoUnit.HOURS.between(ahora, fechaHoraCita);
        boolean mismoDia = cita.getFechaCita().equals(LocalDate.now());

        if (mismoDia) {
            return 0;
        } else if (horasRestantes < 24) {
            return 50;
        } else {
            return 100;
        }
    }

    public BigDecimal calcularMontoReembolso(Cita cita) {
        int porcentaje = calcularPorcentajeReembolso(cita);
        BigDecimal montoOriginal = cita.getMontoPagado() != null ? cita.getMontoPagado()
                : cita.getServicio().getPrecioMinimo();
        return montoOriginal.multiply(BigDecimal.valueOf(porcentaje))
                .divide(BigDecimal.valueOf(100));
    }

    public void cancelarCita(Cita cita, String motivo) {
        int porcentaje = calcularPorcentajeReembolso(cita);
        BigDecimal montoReembolsado = calcularMontoReembolso(cita);

        cita.setEstado("cancelada");
        citaRepository.save(cita);

        try {
            notificacionService.enviarCancelacionConReembolso(cita, motivo, montoReembolsado, BigDecimal.valueOf(porcentaje));
        } catch (Exception e) {
            System.err.println("Error enviando notificacion de cancelacion con reembolso: " + e.getMessage());
        }
    }
}
