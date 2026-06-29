package com.antonela.art.service;

import com.antonela.art.entity.Cita;
import com.antonela.art.repository.CitaRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class RecordatorioTask {

    private static final Logger logger = LoggerFactory.getLogger(RecordatorioTask.class);

    private final CitaRepository citaRepository;
    private final NotificacionService notificacionService;

    public RecordatorioTask(CitaRepository citaRepository, NotificacionService notificacionService) {
        this.citaRepository = citaRepository;
        this.notificacionService = notificacionService;
    }

    @Scheduled(cron = "0 0 8 * * ?")
    public void enviarRecordatoriosDiarios() {
        LocalDate manana = LocalDate.now().plusDays(1);
        try {
            List<Cita> citas = citaRepository.findByFechaCitaBetweenOrderByFechaCitaAscHoraCitaAsc(manana, manana);
            logger.info("RecordatorioTask: {} citas encontradas para {}", citas.size(), manana);
            for (Cita cita : citas) {
                String estado = cita.getEstado();
                if (estado != null && estado.equalsIgnoreCase("cancelada")) {
                    logger.debug("Omitiendo cita id={} porque está cancelada", cita.getId());
                    continue;
                }
                try {
                    notificacionService.enviarRecordatorioCita(cita);
                } catch (Exception e) {
                    logger.error("Error enviando recordatorio para cita id={}: {}", cita.getId(), e.getMessage(), e);
                }
            }
        } catch (Exception e) {
            logger.error("RecordatorioTask falló al obtener citas: {}", e.getMessage(), e);
        }
    }
}
