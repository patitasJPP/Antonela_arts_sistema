package com.antonela.art.service;

import com.antonela.art.entity.Cita;
import com.antonela.art.entity.NotificacionAdmin;
import com.antonela.art.entity.OrdenCompra;
import com.antonela.art.repository.NotificacionAdminRepository;
import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

@Service
public class NotificacionService {

    private final JavaMailSender mailSender;
    private final NotificacionAdminRepository notificacionAdminRepository;

    @Value("${twilio.account-sid:}")
    private String accountSid;

    @Value("${twilio.auth-token:}")
    private String authToken;

    @Value("${twilio.whatsapp-number:}")
    private String twilioWhatsappNumber;

    public NotificacionService(JavaMailSender mailSender,
                               NotificacionAdminRepository notificacionAdminRepository) {
        this.mailSender = mailSender;
        this.notificacionAdminRepository = notificacionAdminRepository;
    }

    @PostConstruct
    public void initTwilio() {
        if (isPlaceholder(accountSid) || isPlaceholder(authToken) || isPlaceholder(twilioWhatsappNumber)) {
            System.out.println("[NotificacionService] Twilio en modo simulado (credenciales placeholder).");
            return;
        }
        Twilio.init(accountSid, authToken);
        System.out.println("[NotificacionService] Twilio inicializado correctamente.");
    }

    // =========================
    // MÉTODOS PÚBLICOS
    // =========================

    public void enviarConfirmacionCita(Cita cita) {
        String mensaje = generarMensajeConfirmacionCita(cita);
        enviarWhatsApp(cita.getCliente().getTelefono(), mensaje);
        enviarEmail(cita.getCliente().getCorreoElectronico(), "Confirmación de cita", mensaje);
        registrarNotificacionAdmin("CONFIRMACION_CITA",
                "Se confirmó la cita de " + cita.getCliente().getNombreCompleto());
    }

    public void enviarRecordatorioCita(Cita cita) {
        String mensaje = generarMensajeRecordatorioCita(cita);
        enviarWhatsApp(cita.getCliente().getTelefono(), mensaje);
        enviarEmail(cita.getCliente().getCorreoElectronico(), "Recordatorio de cita", mensaje);
    }

    public void enviarCancelacionCita(Cita cita, String motivo) {
        String mensaje = generarMensajeCancelacionCita(cita, motivo);
        enviarWhatsApp(cita.getCliente().getTelefono(), mensaje);
        enviarEmail(cita.getCliente().getCorreoElectronico(), "Cancelación de cita", mensaje);
        registrarNotificacionAdmin("CANCELACION_CITA",
                "Se canceló la cita de " + cita.getCliente().getNombreCompleto());
    }

    public void enviarCancelacionConReembolso(Cita cita, String motivo, BigDecimal monto, BigDecimal porcentaje) {
        String mensaje = generarMensajeCancelacionConReembolso(cita, motivo, monto, porcentaje);
        enviarWhatsApp(cita.getCliente().getTelefono(), mensaje);
        enviarEmail(cita.getCliente().getCorreoElectronico(), "Cancelación con reembolso", mensaje);
    }

    public void enviarReagendamientoCita(Cita cita, LocalDate fechaAnterior, LocalTime horaAnterior) {
        String mensaje = generarMensajeReagendamientoCita(cita, fechaAnterior, horaAnterior);
        enviarWhatsApp(cita.getCliente().getTelefono(), mensaje);
        enviarEmail(cita.getCliente().getCorreoElectronico(), "Reagendamiento de cita", mensaje);
    }

    public void enviarConfirmacionPedido(OrdenCompra orden) {
        String mensaje = generarMensajeConfirmacionPedido(orden);
        enviarWhatsApp(orden.getCliente().getTelefono(), mensaje);
        enviarEmail(orden.getCliente().getCorreoElectronico(), "Confirmación de pedido", mensaje);
        registrarNotificacionAdmin("CONFIRMACION_PEDIDO",
                "Nuevo pedido #" + orden.getId() + " para " + orden.getCliente().getNombreCompleto());
    }

    public void enviarPagoCita(Cita cita) {
        String mensaje = generarMensajePagoCita(cita);
        enviarWhatsApp(cita.getCliente().getTelefono(), mensaje);
        enviarEmail(cita.getCliente().getCorreoElectronico(), "Pago recibido", mensaje);
        registrarNotificacionAdmin("PAGO_CITA",
                "Pago recibido para la cita de " + cita.getCliente().getNombreCompleto());
    }

    // =========================
    // WHATSAPP
    // =========================

    private boolean enviarWhatsApp(String destinatario, String mensaje) {
        if (destinatario == null || destinatario.isBlank()
                || isPlaceholder(accountSid)
                || isPlaceholder(authToken)
                || isPlaceholder(twilioWhatsappNumber)) {
            System.out.println("[NotificacionService] WhatsApp simulado para " + destinatario);
            return false;
        }
        try {
            Message.creator(
                    new PhoneNumber("whatsapp:" + destinatario),
                    new PhoneNumber(twilioWhatsappNumber),
                    mensaje
            ).create();
            return true;
        } catch (Exception e) {
            System.err.println("[NotificacionService] Error WhatsApp: " + e.getMessage());
            return false;
        }
    }

    // =========================
    // EMAIL
    // =========================

    private void enviarEmail(String destinatario, String asunto, String cuerpo) {
        if (destinatario == null || destinatario.isBlank()) {
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(destinatario);
            message.setSubject(asunto);
            message.setText(cuerpo);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("[NotificacionService] Error Email: " + e.getMessage());
        }
    }

    // =========================
    // ADMIN LOG
    // =========================

    private void registrarNotificacionAdmin(String tipo, String mensaje) {
        try {
            NotificacionAdmin notificacion = NotificacionAdmin.builder()
                    .tipo(tipo)
                    .mensaje(mensaje)
                    .leida(false)
                    .build();
            notificacionAdminRepository.save(notificacion);
        } catch (Exception e) {
            System.err.println("[NotificacionService] Error admin: " + e.getMessage());
        }
    }

    // =========================
    // MENSAJES
    // =========================

    private String generarMensajeConfirmacionCita(Cita cita) {
        return String.format(
                "Hola %s, tu cita para %s ha sido confirmada el %s a las %s.",
                cita.getCliente().getNombreCompleto(),
                cita.getServicio().getNombre(),
                formatearFecha(cita.getFechaCita()),
                formatearHora(cita.getHoraCita())
        );
    }

    private String generarMensajeRecordatorioCita(Cita cita) {
        return String.format(
                "Recordatorio: tu cita para %s es el %s a las %s.",
                cita.getServicio().getNombre(),
                formatearFecha(cita.getFechaCita()),
                formatearHora(cita.getHoraCita())
        );
    }

    private String generarMensajeCancelacionCita(Cita cita, String motivo) {
        return String.format(
                "Tu cita para %s fue cancelada. Motivo: %s.",
                cita.getServicio().getNombre(),
                motivo
        );
    }

    private String generarMensajeCancelacionConReembolso(Cita cita, String motivo,
                                                         BigDecimal monto, BigDecimal porcentaje) {
        return String.format(
                "Cancelación confirmada. Reembolso: %s (%s%%). Motivo: %s.",
                monto,
                porcentaje,
                motivo
        );
    }

    private String generarMensajeReagendamientoCita(Cita cita, LocalDate fechaAnterior, LocalTime horaAnterior) {
        return String.format(
                "Tu cita fue reagendada de %s %s a %s %s.",
                formatearFecha(fechaAnterior),
                formatearHora(horaAnterior),
                formatearFecha(cita.getFechaCita()),
                formatearHora(cita.getHoraCita())
        );
    }

    private String generarMensajeConfirmacionPedido(OrdenCompra orden) {
        return String.format(
                "Pedido #%s confirmado por %s.",
                orden.getId(),
                orden.getMontoTotal()
        );
    }

    private String generarMensajePagoCita(Cita cita) {
        return String.format(
                "Pago recibido para tu cita del %s a las %s.",
                formatearFecha(cita.getFechaCita()),
                formatearHora(cita.getHoraCita())
        );
    }

    // =========================
    // HELPERS
    // =========================

    private String formatearFecha(LocalDate fecha) {
        return fecha == null ? "pronto" :
                fecha.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
    }

    private String formatearHora(LocalTime hora) {
        return hora == null ? "pronto" :
                hora.format(DateTimeFormatter.ofPattern("HH:mm"));
    }

    private boolean isPlaceholder(String value) {
        return value == null
                || value.isBlank()
                || value.contains("placeholder")
                || value.equals("ACplaceholder");
    }
}
