package com.antonela.art.controller;

import com.antonela.art.entity.Cliente;
import com.antonela.art.entity.OrdenCompra;
import com.antonela.art.repository.ClienteRepository;
import com.antonela.art.repository.OrdenCompraRepository;
import com.antonela.art.service.CheckoutService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cart")
public class CheckoutController {

    private final CheckoutService checkoutService;
    private final ClienteRepository clienteRepository;
    private final OrdenCompraRepository ordenCompraRepository;

    public CheckoutController(CheckoutService checkoutService,
                              ClienteRepository clienteRepository,
                              OrdenCompraRepository ordenCompraRepository) {
        this.checkoutService = checkoutService;
        this.clienteRepository = clienteRepository;
        this.ordenCompraRepository = ordenCompraRepository;
    }

    @PostMapping("/checkout")
    public ResponseEntity<?> checkout(@RequestBody Map<String, Object> body) {
        try {
            Long idCliente = (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

            Cliente cliente = clienteRepository.findById(idCliente)
                    .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> productos = (List<Map<String, Object>>) body.get("productos");
            String metodoPago = (String) body.get("metodoPago");

            OrdenCompra orden = checkoutService.procesarCheckout(cliente, productos, metodoPago);

            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "mensaje", "Orden creada exitosamente",
                    "ordenId", orden.getId(),
                    "idTransaccion", orden.getIdTransaccionSimulada(),
                    "montoTotal", orden.getMontoTotal()));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("client/orders")
    public ResponseEntity<?> obtenerMisOrdenes() {
        try {
            // 1. Obtener idCliente del token
            Long idCliente = (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

            // 2. Llamada corregida usando la instancia inyectada 'ordenRepository'
            List<OrdenCompra> ordenes = ordenCompraRepository.findByClienteIdOrderByCreadoEnDesc(idCliente);

            return ResponseEntity.ok(ordenes);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }
}