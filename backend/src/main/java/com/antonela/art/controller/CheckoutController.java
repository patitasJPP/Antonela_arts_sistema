package com.antonela.art.controller;

import com.antonela.art.entity.Cliente;
import com.antonela.art.entity.OrdenCompra;
import com.antonela.art.entity.Producto;
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
    private final OrdenCompraRepository ordenCompraRepository; // Declarada correctamente

    // CORRECCIÓN: El constructor debe recibir los TRES parámetros
    public CheckoutController(CheckoutService checkoutService,
                              ClienteRepository clienteRepository,
                              OrdenCompraRepository ordenCompraRepository) { // <--- Agregado aquí
        this.checkoutService = checkoutService;
        this.clienteRepository = clienteRepository;
        this.ordenCompraRepository = ordenCompraRepository; // <--- Asignación agregada
    }

    @PostMapping("/checkout")
    public ResponseEntity<?> checkout(@RequestBody Map<String, Object> body) {
        try {
            // 1. Obtener idCliente del token (SecurityContext)
            // Spring Security ya validó el JWT y guardó el ID en el "Principal"
            Long idCliente = (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

            // 2. Buscar al cliente en la BD usando el ID del token
            Cliente cliente = clienteRepository.findById(idCliente)
                    .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

            // 3. Extraer datos del body enviado por el frontend
            // El JSON esperado: { "productos": [...], "metodoPago": "efectivo" }
            List<Producto> productos = (List<Producto>) body.get("productos");
            String metodoPago = (String) body.get("metodoPago");

            // 4. Llamar a tu Capa de Servicio
            String resultado = checkoutService.procesarCheckout(cliente, productos, metodoPago);

            // 5. Retornar 201 (Created) con el mensaje que armaste en el servicio
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("mensaje", resultado));

        } catch (Exception e) {
            // Retornar error 400 si algo falla (carrito vacío, método pago inválido, etc)
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
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