package com.antonela.art.service;
import ch.qos.logback.core.net.server.Client;
import com.antonela.art.entity.Cliente;
import com.antonela.art.entity.OrdenCompra;
import com.antonela.art.entity.Producto;
import com.antonela.art.repository.ClienteRepository;
import com.antonela.art.repository.OrdenCompraRepository;
import com.antonela.art.repository.ProductoRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class CheckoutService {


    private final ClienteRepository clienteRepository;
    private final OrdenCompraRepository ordenRepository; // Asumiendo que existe para guardar
    private final ObjectMapper objectMapper; // Para serializar a JSON

    // Inyección de dependencias por constructor
    public CheckoutService(ClienteRepository clienteRepository, OrdenCompraRepository ordenRepository,ObjectMapper objectMapper) {
        this.clienteRepository = clienteRepository;
        this.ordenRepository = ordenRepository;
        this.objectMapper = objectMapper;
    }

    public String procesarCheckout(Cliente cliente, List<Producto> items, String metodoPago) throws Exception {

        // 1. Validar que el carrito no esté vacío
        if (items == null || items.isEmpty()) {
            throw new IllegalArgumentException("El carrito no puede estar vacío.");
        }

        // 2. Validar método de pago
        if (!metodoPago.equals("efectivo") && !metodoPago.equals("simulado_credito")) {
            throw new IllegalArgumentException("Método de pago no válido.");
        }

        // 3. Generar IDs únicos
        String timestamp = String.valueOf(Instant.now().getEpochSecond());
        String randomSuffix = String.valueOf((int)(Math.random() * 1000));


        //esto fue modificado porque la base de datos solo acepta long
        long idOrden = Long.valueOf(timestamp + 000 + randomSuffix);
        String idTransaccion = "SIM-" + timestamp + "-" + randomSuffix;

        // 4. Serializar productos a JSON
        // Esto convierte la lista de objetos en un String formato JSON para la BD
        String productosJson = objectMapper.writeValueAsString(items);

        // 5. Guardar en BD
        // Aquí es donde usas el ClienteRepository si necesitas refrescar datos del cliente
        // o verificar su existencia antes de crear la Orden.
        OrdenCompra nuevaOrden = new OrdenCompra();
        nuevaOrden.setId(idOrden);
        nuevaOrden.setIdTransaccionSimulada(idTransaccion);
        nuevaOrden.setCliente(cliente);
        nuevaOrden.setProductos(productosJson);
        nuevaOrden.setMetodoPago(metodoPago);

        ordenRepository.save(nuevaOrden);
    String mensaje="el id de la operacion es el:"+idOrden;
        return mensaje; // Retornamos el ID de la orden procesada
    }
}