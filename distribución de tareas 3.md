# Distribución de Tareas 3 — Antonela Art Salon

**Objetivo:** Completar las funcionalidades faltantes para que `Antonela_arts_sistema` equivalga al proyecto final (`DiseñoProductos_Grupo1`), organizado en **5 developers por capas técnicas**.

> **Estado actual:** El sistema ya tiene funcional hasta el **Checkpoint 10** (autenticación, catálogos, carrito, checkout simulado, panel cliente, cancelaciones con reembolso, calendario admin, inventario, tareas, recuperación de contraseña).
>
> **Lo que falta:** Stripe (pagos reales), Twilio + email (notificaciones), recordatorios automáticos, panel admin completo (Dashboard, Órdenes, Clientes, Galería, Servicios con CRUD), configuración de producción y deploy.

---

## 0. Preparación: Cuenta Gmail Compartida y Servicios

Antes de comenzar, crear una cuenta de Gmail **compartida** para que los 5 developers tengan acceso a las credenciales de los servicios externos.

### 0.1 Crear cuenta Gmail compartida

| Campo | Sugerencia |
|-------|-----------|
| Correo | `antonelaartutp@gmail.com`|
| Contraseña | AntonelaArtUTP12345// |

### 0.2 Servicios externos a configurar

| # | Servicio | Tipo | Lo que provee |
|---|----------|------|---------------|
| 1 | **Vercel** | Deploy frontend | Hosting del frontend React, dominio `*.vercel.app` |
| 2 | **Render** | Deploy backend | Hosting del backend Spring Boot + PostgreSQL |
| 3 | **Neon Tech** | Base de datos | PostgreSQL en la nube (plan gratuito) |
| 4 | **Stripe** | Pagos | API keys de TEST (sk_test_..., pk_test_...) + Webhook |
| 5 | **Twilio** | WhatsApp | Account SID, Auth Token, número WhatsApp (sandbox TEST) |
| 6 | **Gmail SMTP** | Email | Contraseña de aplicación para `spring.mail` |

### 0.3 Variables de entorno comunes

Una vez configurados los servicios, el Dev 5 las documentará en un archivo `.env` compartido:

```properties
# DB (Neon)
DB_URL=jdbc:postgresql://ep-...us-east-1.aws.neon.tech/antonela_art_salon?sslmode=require
DB_USER=antonela_dev
DB_PASSWORD=...

# JWT
JWT_SECRET=...

# CORS
CORS_ORIGINS=https://antonela-art-salon.vercel.app
FRONTEND_URL=https://antonela-art-salon.vercel.app

# Stripe (TEST)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Twilio (TEST)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Gmail SMTP
MAIL_USERNAME=antonela.dev.team@gmail.com
MAIL_PASSWORD=...contraseña de aplicación...
```

---

## Developer 1 — Backend: Pagos Reales (Stripe + Webhooks)

### Tasks

| # | Task | Archivos a crear/modificar |
|---|------|---------------------------|
| 1.1 | Agregar dependencia Stripe en `pom.xml` | `pom.xml` (agregar `stripe-java` v28.4.0) |
| 1.2 | Actualizar entidades Pago y OrdenCompra con campos Stripe | `entity/Pago.java`, `entity/OrdenCompra.java` (agregar `preferenceId`, `mercadoPagoPaymentId`) |
| 1.3 | Crear `StripeService.java` | `service/StripeService.java` |
| 1.4 | Crear `WebhookController.java` | `controller/WebhookController.java` |
| 1.5 | Actualizar `application.properties` con config Stripe | `src/main/resources/application.properties` |
| 1.6 | Actualizar `ServicioPago.java` para integrar Stripe | `service/ServicioPago.java` |

### Detalle de implementación

**1.1 — pom.xml:** Agregar dentro de `<dependencies>`:

```xml
<!-- Stripe SDK -->
<dependency>
    <groupId>com.stripe</groupId>
    <artifactId>stripe-java</artifactId>
    <version>28.4.0</version>
</dependency>
```

**1.2 — Pago.java y OrdenCompra.java:** Actualizar entidades:

```java
// En Pago.java y OrdenCompra.java:
@Column(name = "preference_id", length = 255)
private String preferenceId;

@Column(name = "mercado_pago_payment_id")
private Long mercadoPagoPaymentId;
```

**1.3 — StripeService.java:**

```java
@Service
public class StripeService {
    // Inyectar: OrdenCompraRepository, PagoRepository, CitaRepository, NotificacionService
    // Configurar Stripe.apiKey desde application.properties con @PostConstruct
    // Métodos:
    //   - crearSesionProductos(Cliente, List<Map>, BigDecimal, Long ordenId): Session
    //   - crearSesionCita(Cita): Session
    //   - procesarPagoExitoso(String clientReferenceId, String paymentIntentId):
    //       * Si clientReferenceId empieza con "cita_" -> buscar cita, registrar pago Stripe
    //       * Si es número -> buscar orden, marcar como completada
    //       * Llamar notificacionService.enviarPagoCita() o enviarConfirmacionPedido()
}
```

Ver referencia completa en `DiseñoProductos_Grupo1/backend/src/main/java/com/antonela/art/service/StripeService.java`

**1.4 — WebhookController.java:**

```java
@RestController
@RequestMapping("/api/webhook")
public class WebhookController {
    // POST /api/webhook/stripe -> recibe payload + Stripe-Signature header
    //   - Verificar firma con Webhook.constructEvent() (si webhookSecret está configurado)
    //   - En "checkout.session.completed" -> extraer client_reference_id y payment_intent
    //   - Llamar stripeService.procesarPagoExitoso()
    // GET /api/webhook/stripe -> health check
}
```

**1.5 — application.properties:** Agregar:

```properties
# Stripe
stripe.secret-key=${STRIPE_SECRET_KEY:sk_test_TU_SECRET_KEY_AQUI}
stripe.publishable-key=${STRIPE_PUBLISHABLE_KEY:pk_test_TU_PUBLISHABLE_KEY}
stripe.webhook-secret=${STRIPE_WEBHOOK_SECRET:}
# Frontend URL para redirecciones Stripe
app.frontend-url=${FRONTEND_URL:http://localhost:3000}
```

**1.6 — ServicioPago.java:** Modificar `procesarPago()` para que, si `metodoPago` es "stripe", cree una sesión de Stripe en lugar del pago simulado. Mantener "efectivo" y "simulado_credito" como caída.

---

## Developer 2 — Backend: Notificaciones y Recordatorios (Twilio + Email + Scheduler)

### Tasks

| # | Task | Archivos |
|---|------|----------|
| 2.1 | Agregar dependencias Twilio y Spring Mail en `pom.xml` | `pom.xml` |
| 2.2 | Crear `NotificacionService.java` | `service/NotificacionService.java` |
| 2.3 | Crear `RecordatorioTask.java` | `service/RecordatorioTask.java` |
| 2.4 | Actualizar `application.properties` con Twilio + Mail | `src/main/resources/application.properties` |
| 2.5 | Actualizar `CancelacionService.java` para usar notificaciones | `service/CancelacionService.java` |
| 2.6 | Actualizar `ReservaService.java` para enviar confirmación | `service/ReservaService.java` |

### Detalle de implementación

**2.1 — pom.xml:** Agregar dentro de `<dependencies>`:

```xml
<!-- Twilio SDK para WhatsApp -->
<dependency>
    <groupId>com.twilio.sdk</groupId>
    <artifactId>twilio</artifactId>
    <version>9.14.1</version>
</dependency>

<!-- Spring Mail para fallback por correo -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-mail</artifactId>
</dependency>
```

**2.2 — NotificacionService.java:**

```java
@Service
public class NotificacionService {
    // Inyectar: JavaMailSender, NotificacionAdminRepository
    // @Value: twilio.account-sid, twilio.auth-token, twilio.whatsapp-number
    // @PostConstruct: initTwilio() - inicializar Twilio si hay credenciales reales

    // Métodos públicos:
    //   - enviarConfirmacionCita(Cita) -> WhatsApp + fallback email + notificación admin
    //   - enviarRecordatorioCita(Cita) -> WhatsApp + fallback email
    //   - enviarCancelacionCita(Cita, String motivo) -> WhatsApp + fallback email + notificación admin
    //   - enviarCancelacionConReembolso(Cita, motivo, monto, porcentaje) -> WhatsApp + fallback email
    //   - enviarReagendamientoCita(Cita, fechaAnterior, horaAnterior) -> WhatsApp + fallback email
    //   - enviarConfirmacionPedido(OrdenCompra) -> WhatsApp + fallback email + notificación admin
    //   - enviarPagoCita(Cita) -> WhatsApp + fallback email + notificación admin

    // Métodos privados:
    //   - enviarWhatsApp(destinatario, mensaje) -> boolean
    //   - enviarEmail(destinatario, asunto, cuerpo)
    //   - registrarNotificacionAdmin(tipo, mensaje)
    //   - generarMensaje*(...) -> String (generar contenido de cada tipo)
}
```

Ver referencia completa en `DiseñoProductos_Grupo1/backend/src/main/java/com/antonela/art/service/NotificacionService.java`

**2.3 — RecordatorioTask.java:**

```java
@Component
public class RecordatorioTask {
    // Inyectar: CitaRepository, NotificacionService
    // @Scheduled(cron = "0 0 8 * * ?") -> todos los días a las 8:00 AM
    //   - Buscar citas de mañana (LocalDate.now().plusDays(1))
    //   - Para cada cita no cancelada -> notificacionService.enviarRecordatorioCita(cita)
}
```

**2.4 — application.properties:** Agregar:

```properties
# Twilio (WhatsApp)
twilio.account-sid=${TWILIO_ACCOUNT_SID:ACplaceholder}
twilio.auth-token=${TWILIO_AUTH_TOKEN:placeholder}
twilio.whatsapp-number=${TWILIO_WHATSAPP_NUMBER:whatsapp:+14155238886}

# Spring Mail (Gmail SMTP)
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=${MAIL_USERNAME:placeholder}
spring.mail.password=${MAIL_PASSWORD:placeholder}
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
```

**2.5 — CancelacionService.java:** En `cancelarCita()`, después de procesar la cancelación, llamar a `notificacionService.enviarCancelacionConReembolso(cita, motivo, montoReembolsado, porcentaje)`.

**2.6 — ReservaService.java:** En `crearCita()`, después de guardar la cita exitosamente, llamar a `notificacionService.enviarConfirmacionCita(cita)`.

---

## Developer 3 — Backend: Panel Admin (Controladores CRUD)

### Tasks

| # | Task | Archivos |
|---|------|----------|
| 3.1 | Crear `AdminDashboardController.java` | `controller/AdminDashboardController.java` |
| 3.2 | Crear `AdminCitaController.java` | `controller/AdminCitaController.java` |
| 3.3 | Crear `AdminClienteController.java` | `controller/AdminClienteController.java` |
| 3.4 | Crear `AdminGaleriaController.java` | `controller/AdminGaleriaController.java` |
| 3.5 | Crear `AdminOrdenController.java` | `controller/AdminOrdenController.java` |
| 3.6 | Crear `AdminProductoController.java` | `controller/AdminProductoController.java` |
| 3.7 | Crear `AdminServicioController.java` | `controller/AdminServicioController.java` |
| 3.8 | Actualizar seed data con productos de ejemplo | `database/init.sql` o `database/seed_productos.sql` |

### Detalle de implementación

**3.1 — AdminDashboardController.java:**

| Método | Ruta | Función |
|--------|------|---------|
| GET | `/api/admin/dashboard` | Retorna stats: citasHoy, totalClientes, productosActivos, totalOrdenes |
| GET | `/api/admin/dashboard/notifications` | Lista de NotificacionAdmin ordenadas por fecha descendente |
| POST | `/api/admin/dashboard/notifications/{id}/read` | Marca notificación como leída |

**3.2 — AdminCitaController.java:**

| Método | Ruta | Función |
|--------|------|---------|
| GET | `/api/admin/appointments` | Lista citas con filtros opcionales `desde` y `hasta` |
| GET | `/api/admin/appointments/{id}` | Detalle de cita |
| PUT | `/api/admin/appointments/{id}/status` | Cambiar estado de cita. Si es "cancelada" o "confirmada", enviar notificación |
| PUT | `/api/admin/appointments/{id}/reschedule` | Reprogramar cita (nueva fecha/hora) y notificar |

**3.3 — AdminClienteController.java:**

| Método | Ruta | Función |
|--------|------|---------|
| GET | `/api/admin/clients` | Lista todos los clientes |
| GET | `/api/admin/clients/{id}` | Detalle de cliente |
| GET | `/api/admin/clients/{id}/appointments` | Citas del cliente |
| GET | `/api/admin/clients/{id}/orders` | Órdenes del cliente |

**3.4 — AdminGaleriaController.java:**

| Método | Ruta | Función |
|--------|------|---------|
| GET | `/api/admin/gallery` | Lista imágenes ordenadas por categoría |
| POST | `/api/admin/gallery` | Crear nueva imagen (body: urlImagen, categoria, descripcion, idServicio opcional) |
| DELETE | `/api/admin/gallery/{id}` | Eliminar imagen |

**3.5 — AdminOrdenController.java:**

| Método | Ruta | Función |
|--------|------|---------|
| GET | `/api/admin/orders` | Lista órdenes ordenadas por fecha descendente |
| PUT | `/api/admin/orders/{id}/status` | Actualizar estado de orden ("pendiente", "completada", "cancelada") |

**3.6 — AdminProductoController.java:**

| Método | Ruta | Función |
|--------|------|---------|
| GET | `/api/admin/products` | Lista productos |
| GET | `/api/admin/products/{id}` | Detalle producto |
| POST | `/api/admin/products` | Crear producto |
| PUT | `/api/admin/products/{id}` | Actualizar producto completo |
| PATCH | `/api/admin/products/{id}/disponible` | Cambiar disponibilidad (body: { "disponible": true/false }) |
| DELETE | `/api/admin/products/{id}` | Eliminar producto |

**3.7 — AdminServicioController.java:**

| Método | Ruta | Función |
|--------|------|---------|
| GET | `/api/admin/services` | Lista servicios |
| GET | `/api/admin/services/{id}` | Detalle servicio |
| POST | `/api/admin/services` | Crear servicio |
| PUT | `/api/admin/services/{id}` | Actualizar servicio |
| DELETE | `/api/admin/services/{id}` | Eliminar servicio |

**3.8 — Seed de productos:** Agregar al `database/init.sql` o crear `database/seed_productos.sql`:

```sql
INSERT INTO productos (nombre, descripcion, precio, url_imagen, disponible) VALUES
  ('Shampoo Profesional', 'Shampoo suave para todo tipo de cabello', 35.00, 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400', true),
  ('Aceite de Argan', 'Aceite nutritivo para cabello seco', 45.00, 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400', true),
  ('Crema para Manos', 'Crema hidratante con vitamina E', 25.00, 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=400', true),
  ('Esmalte Semi-permanente', 'Esmalte de larga duración, varios colores', 30.00, 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=400', true),
  ('Mascarilla Capilar', 'Tratamiento intensivo de keratina', 55.00, 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400', true),
  ('Set de Cepillos', 'Set de 3 cepillos profesionales', 40.00, 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400', true),
  ('Quitaesmalte', 'Quitaesmalte sin acetona', 15.00, 'https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?w=400', true),
  ('Protector Térmico', 'Spray protector para planchas y secadores', 38.00, 'https://images.unsplash.com/photo-1612293907727-3cb72010a6c3?w=400', true),
  ('Labial Hidratante', 'Bálsamo labial con color natural', 20.00, 'https://images.unsplash.com/photo-1631214524020-7e18db9a8f92?w=400', true);
```

---

## Developer 4 — Frontend: Admin Panel (Layout + Páginas)

### Tasks

| # | Task | Archivos |
|---|------|----------|
| 4.1 | Crear `AdminLayout.tsx` | `src/pages/admin/AdminLayout.tsx` |
| 4.2 | Crear `AdminAuthGuard.tsx` | `src/pages/admin/AdminAuthGuard.tsx` |
| 4.3 | Crear `AdminDashboard.tsx` | `src/pages/admin/AdminDashboard.tsx` |
| 4.4 | Crear `AdminOrders.tsx` | `src/pages/admin/AdminOrders.tsx` |
| 4.5 | Crear `AdminClients.tsx` | `src/pages/admin/AdminClients.tsx` |
| 4.6 | Crear `AdminGallery.tsx` | `src/pages/admin/AdminGallery.tsx` |
| 4.7 | Crear `AdminServices.tsx` | `src/pages/admin/AdminServices.tsx` |
| 4.8 | Actualizar `App.tsx` con nuevas rutas admin | `src/App.tsx` |
| 4.9 | Agregar dependencia `bootstrap-icons` | `package.json` |

### Detalle de implementación

**4.1 — AdminLayout.tsx:** Layout del panel admin con sidebar de navegación.

- Sidebar con iconos (bootstrap-icons) y links:
  - Dashboard (`/admin`), Calendario (`/admin/calendar`), Servicios (`/admin/services`),
    Inventario (`/admin/inventory`), Galería (`/admin/gallery`), Órdenes (`/admin/orders`),
    Clientes (`/admin/clients`), Tareas (`/admin/tasks`)
- Logo "Antonela Admin" en el sidebar
- Footer con nombre de usuario admin + botón cerrar sesión
- Responsive: sidebar colapsable con toggle + overlay en móvil
- Usa `<Outlet />` de React Router para renderizar rutas hijas

Ver referencia: `DiseñoProductos_Grupo1/frontend/src/pages/admin/AdminLayout.tsx`

**4.2 — AdminAuthGuard.tsx:** Componente guard que protege rutas admin.

```tsx
const AdminAuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, userRole } = useAuth();
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  if (userRole !== "admin") return <Navigate to="/" replace />;
  return <>{children}</>;
};
```

**4.3 — AdminDashboard.tsx:** Dashboard con métricas.

- Llamar `GET /api/admin/dashboard` al montar
- Llamar `GET /api/admin/dashboard/notifications` al montar
- Mostrar 4 tarjetas: Citas Hoy, Clientes Registrados, Productos Activos, Órdenes de Compra
- Sección "Accesos Rápidos" con links a Calendario, Servicios, Inventario, Clientes
- Sección "Notificaciones" con lista de notificaciones + badge de no leídas
- Botón para marcar notificación como leída (`POST /api/admin/dashboard/notifications/{id}/read`)

**4.4 — AdminOrders.tsx:** Gestión de órdenes de compra.

- Llamar `GET /api/admin/orders` al montar
- Tabla con columnas: ID, Cliente, Productos, Total, Método, Estado, Fecha, Acción
- Select para cambiar estado (pendiente/completada/cancelada) -> `PUT /api/admin/orders/{id}/status`
- Parsear JSON de productos (`JSON.parse`) para mostrar items

**4.5 — AdminClients.tsx:** Lista de clientes con detalle.

- Llamar `GET /api/admin/clients` al montar
- Input de búsqueda (filtra por nombre, correo o teléfono)
- Al hacer clic en un cliente, mostrar detalle:
  - Citas del cliente: `GET /api/admin/clients/{id}/appointments`
  - Órdenes del cliente: `GET /api/admin/clients/{id}/orders`
- Vista de dos columnas: lista a la izquierda, detalle a la derecha

**4.6 — AdminGallery.tsx:** CRUD de imágenes de galería.

- Llamar `GET /api/admin/gallery` al montar
- Formulario para agregar imagen: URL, categoría -> `POST /api/admin/gallery`
- Grid de imágenes con botón eliminar -> `DELETE /api/admin/gallery/{id}`

**4.7 — AdminServices.tsx:** CRUD de servicios.

- Llamar `GET /api/admin/services` al montar
- Botón "Nuevo Servicio" abre modal con formulario
- Modal para crear/editar: nombre, descripción, precio mínimo, precio máximo
- Guardar -> `POST /api/admin/services` (crear) o `PUT /api/admin/services/{id}` (editar)
- Botón eliminar -> `DELETE /api/admin/services/{id}`

**4.8 — App.tsx:** Actualizar rutas con la nueva estructura admin:

```tsx
// Importar nuevos componentes:
import AdminLayout from "./pages/admin/AdminLayout";
import AdminAuthGuard from "./pages/admin/AdminAuthGuard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminServices from "./pages/admin/AdminServices";
import AdminGallery from "./pages/admin/AdminGallery";
import AdminClients from "./pages/admin/AdminClients";
import AdminOrders from "./pages/admin/AdminOrders";

// Agregar al router:
{
  path: "/admin",
  element: (
    <AdminAuthGuard>
      <AdminLayout />
    </AdminAuthGuard>
  ),
  children: [
    { path: "", element: <AdminDashboard /> },
    { path: "calendar", element: <AdminCalendar /> },
    { path: "services", element: <AdminServices /> },
    { path: "inventory", element: <AdminInventory /> },
    { path: "gallery", element: <AdminGallery /> },
    { path: "clients", element: <AdminClients /> },
    { path: "orders", element: <AdminOrders /> },
    { path: "tasks", element: <AdminTasks /> },
  ],
},
```

**4.9 — package.json:** Agregar dependencia:

```bash
npm install bootstrap-icons
```

---

## Developer 5 — DevOps: Deploy + Configuración + Cuenta Compartida

### Tasks

| # | Task | Archivos |
|---|------|----------|
| 5.1 | Crear cuenta Gmail compartida y registrar servicios | Documentación |
| 5.2 | Crear `Dockerfile` para backend | `backend/Dockerfile` |
| 5.3 | Crear `vercel.json` para frontend | `frontend/vercel.json` |
| 5.4 | Crear `.env.production` para frontend | `frontend/.env.production` |
| 5.5 | Actualizar `application.properties` con variables de entorno | `backend/src/main/resources/application.properties` |
| 5.6 | Configurar servicios externos | Stripe, Twilio, Neon Tech, Render, Vercel, Gmail SMTP |
| 5.7 | Documentar credenciales y acceso | Archivo `.env` seguro (NO subir a Git) |
| 5.8 | Actualizar `.gitignore` si es necesario | `.gitignore` |
| 5.9 | Configurar CI con GitHub Actions (compilar backend + build frontend) | `.github/workflows/ci.yml` |
| 5.10 | Configurar CD con GitHub Actions (deploy automático a Render + Vercel) | `.github/workflows/cd.yml` |

### Detalle de implementación

**5.1 — Cuenta Gmail compartida:**

1. Crear cuenta: `antonela.dev.team@gmail.com` (o nombre acordado)
2. Compartir acceso con los 5 developers
3. Desde esta cuenta, registrar todos los servicios externos
4. Generar contraseña de aplicación para Gmail SMTP (usar contraseña de aplicación, no la contraseña principal)

**5.2 — Dockerfile:**

```dockerfile
FROM maven:3.9.15-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -DskipTests -B

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

**5.3 — vercel.json:**

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

**5.4 — .env.production:**

```
VITE_API_URL=https://antonela-art-salon-api.onrender.com/api
```

**5.5 — application.properties:** Actualizar para usar variables de entorno con valores por defecto para desarrollo local:

```properties
# Servidor
server.port=8080

# Base de Datos
spring.datasource.url=${DB_URL:jdbc:postgresql://localhost:5432/antonela_art_salon}
spring.datasource.username=${DB_USER:postgres}
spring.datasource.password=${DB_PASSWORD:noe123}
spring.datasource.driver-class-name=org.postgresql.Driver

# JPA
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.properties.hibernate.format_sql=true

# JWT
app.jwt.secret=${JWT_SECRET:AntonelaArtSalonSecretKeyForJWT2026Security}
app.jwt.expiration-ms=86400000

# CORS
app.cors.allowed-origins=${CORS_ORIGINS:http://localhost:3000}

# Frontend URL (para Stripe redirects)
app.frontend-url=${FRONTEND_URL:http://localhost:3000}

# Stripe
stripe.secret-key=${STRIPE_SECRET_KEY:sk_test_TU_SECRET_KEY_AQUI}
stripe.publishable-key=${STRIPE_PUBLISHABLE_KEY:pk_test_TU_PUBLISHABLE_KEY}
stripe.webhook-secret=${STRIPE_WEBHOOK_SECRET:}

# Twilio
twilio.account-sid=${TWILIO_ACCOUNT_SID:ACplaceholder}
twilio.auth-token=${TWILIO_AUTH_TOKEN:placeholder}
twilio.whatsapp-number=${TWILIO_WHATSAPP_NUMBER:whatsapp:+14155238886}

# Spring Mail
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=${MAIL_USERNAME:placeholder}
spring.mail.password=${MAIL_PASSWORD:placeholder}
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true

# Jackson
spring.jackson.serialization.fail-on-empty-beans=false
```

**5.6 — Configurar servicios externos:**

| Servicio | Pasos |
|----------|-------|
| **Neon Tech** | 1. Ir a https://neon.tech 2. Crear proyecto "antonela-art-salon" 3. Region: US East 4. Copiar connection string |
| **Render** | 1. Ir a https://render.com 2. Crear Web Service conectar repo GitHub 3. Build Command: `mvn clean package -DskipTests` 4. Start Command: `java -jar target/*.jar` 5. Setear variables de entorno |
| **Vercel** | 1. Ir a https://vercel.com 2. Importar repo GitHub 3. Framework: Vite 4. Root: `frontend/` 5. Setear `VITE_API_URL` |
| **Stripe** | 1. Ir a https://dashboard.stripe.com 2. Modo TEST 3. Obtener API keys 4. Configurar webhook endpoint: `https://tu-api.onrender.com/api/webhook/stripe` 5. Escuchar evento `checkout.session.completed` |
| **Twilio** | 1. Ir a https://twilio.com 2. Registrar cuenta 3. Ir a Console > Account SID 4. Sandbox WhatsApp: seguir instrucciones para unir sandbox |
| **Gmail SMTP** | 1. Ir a https://myaccount.google.com/apppasswords 2. Generar contraseña de aplicación para "Correo" |

**5.7 — Documentar credenciales:**

Crear archivo `.env.team` (NO subir a Git, solo compartir seguro):

```bash
# ============================================
# Antonela Art Salon - Credenciales de Equipo
# ============================================
# COMPARTIDO VIA: Gestor de contraseñas / Gmail compartido
# NO SUBIR A GIT
# ============================================

# Neon Tech DB
DB_URL=jdbc:postgresql://...
DB_USER=...
DB_PASSWORD=...

# Stripe (TEST)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Twilio (TEST)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Gmail SMTP
MAIL_USERNAME=antonela.dev.team@gmail.com
MAIL_PASSWORD=xxxx xxxx xxxx xxxx

# JWT (cambiar en produccion)
JWT_SECRET=...

# URLs
CORS_ORIGINS=https://antonela-art-salon.vercel.app
FRONTEND_URL=https://antonela-art-salon.vercel.app
VITE_API_URL=https://antonela-art-salon-api.onrender.com/api
```

**5.8 — .gitignore:** Verificar que incluya:

```
# Node
node_modules/
dist/

# Java
target/
*.jar
*.war

# IDE
.idea/
*.iml
.vscode/

# Environment
.env
.env.local
.env.team
*.log

# OS
.DS_Store
Thumbs.db
```

**5.9 — CI con GitHub Actions:** Crear `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  backend:
    name: Compilar Backend (Maven)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Java 21
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: 'maven'
      - name: Compile with Maven
        run: mvn compile -f backend/pom.xml --batch-mode

  frontend:
    name: Build Frontend (Node)
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4
      - name: Set up Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
```

**5.10 — CD con GitHub Actions:** Crear `.github/workflows/cd.yml`:

```yaml
name: CD

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    name: Deploy Backend a Render
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Trigger Render Deploy
        run: |
          curl -X POST "${{ secrets.RENDER_DEPLOY_HOOK_URL }}"

  deploy-frontend:
    name: Deploy Frontend a Vercel
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install Vercel CLI
        run: npm install -g vercel
      - name: Deploy to Vercel
        run: |
          vercel --token ${{ secrets.VERCEL_TOKEN }} --prod --yes
        working-directory: frontend
```

> **Nota:** Los secrets `RENDER_DEPLOY_HOOK_URL` y `VERCEL_TOKEN` deben configurarse en GitHub → Settings → Secrets and variables → Actions. El Dev 5 los obtiene al crear los servicios en Render y Vercel.

---

## Dependencias entre Developers

Ciertas tareas deben completarse en orden:

```
Dev 1 (Stripe)
  └── requiere: Dev 2 (Notificaciones) -> StripeService inyecta NotificacionService

Dev 3 (Admin Controllers)
  ├── requiere: Dev 2 (Notificaciones) -> AdminCitaController usa notificaciones
  └── independiente de Dev 1 y Dev 4

Dev 4 (Admin Frontend)
  ├── requiere: Dev 3 (Admin Controllers) -> las páginas llaman sus endpoints
  └── independiente de Dev 1 y Dev 2

Dev 5 (DevOps)
  └── requiere: Dev 1, 2, 3, 4 -> el deploy se hace al final con todo integrado
```

**Orden sugerido:**
1. **Semana 1:** Dev 1, Dev 2, Dev 3, Dev 4 trabajan en paralelo (sin dependencias fuertes)
2. **Semana 2:** Dev 5 prepara servicios externos (Stripe, Twilio, etc.) mientras los demás terminan. Integración final.
3. **Semana 3:** Deploy y pruebas en producción.

---

## A. Gestión de Repositorios y Commits

### A.1 Historial de Commits del Proyecto

Ejemplos de commits realizados durante el desarrollo (extraídos del repositorio real):

| Mensaje del commit | Fecha | Autor |
|--------------------|-------|-------|
| `feat: implementar modulo de reservas, calendario de slots y panel del cliente` | 2026-05-25 | Carlos_MO |
| `feat: agregar CartContext con persistencia en localStorage` | 2026-05-31 | maiabit |
| `feat: agregar PagoController y completar ServicioPago` | 2026-06-01 | xio |
| `feat: crear CancelacionService y ReembolsoService` | 2026-06-01 | xio |
| `fix: corregir CheckoutService - import erroneo, generacion de ID, montoTotal` | 2026-06-01 | YallicoNB |
| `fix: integrar Products.tsx con CartContext y badge de carrito en Navbar` | 2026-06-01 | YallicoNB |
| `chore: agregar .gitignore para exclude target, node_modules, .idea, logs` | 2026-06-01 | YallicoNB |
| `docs: agregar README y distribución de tareas` | 2026-05-24 | YallicoNB |

### A.2 Buenas Prácticas en Mensajes de Commit

Usar el formato **Conventional Commits**:

```
tipo(alcance): mensaje descriptivo en español
```

| Tipo | Cuándo usarlo | Ejemplo |
|------|---------------|---------|
| `feat` | Nueva funcionalidad | `feat: agregar StripeService con sesiones de pago` |
| `fix` | Corrección de bug | `fix: corregir cálculo de reembolso para mismo día` |
| `docs` | Documentación | `docs: actualizar README con endpoints` |
| `chore` | Tareas de mantenimiento | `chore: actualizar dependencias en pom.xml` |
| `refactor` | Refactorización | `refactor: extraer validación de método de pago` |
| `style` | Cambios de formato | `style: ajustar espaciado en AdminDashboard` |

**Reglas:**
- Primera línea: máximo 72 caracteres
- Usar imperativo ("agregar", no "agregado" ni "agrega")
- Enlazar con issue: `feat: implementar dashboard (#42)`

### A.3 Blobs (Git Internos)

Git almacena los archivos como **blobs** (Binary Large Objects):

```
.git/objects/
  ├── ab/  (directorio con los 2 primeros caracteres del hash)
  │   └── cdef1234...  (blob con el contenido del archivo)
  ├── tree/  (un tree es un objeto que lista blobs + metadatos)
  └── commit/  (un commit apunta a un tree + padre + autor + mensaje)
```

- **Blob**: Contenido comprimido de un archivo. No tiene nombre de archivo.
- **Tree**: Lista de blobs con nombres, permisos y referencias a otros trees (directorios).
- **Commit**: Apunta a un tree y contiene metadatos (autor, fecha, mensaje, padre).

Cuando haces `git add`, Git crea un blob. Cuando haces `git commit`, Git crea un tree (instantánea del proyecto) y un commit object que apunta a ese tree.

### A.4 Estrategia de Ramas (Branching)

El proyecto usa una adaptación de **Git Flow**:

```
main (producción)
  └── develop (integración)
        ├── feat/* (nuevas funcionalidades)
        ├── fix/* (correcciones)
        └── bugfix/* (hotfixes urgentes)
```

| Rama | Propósito | Base | Merge a |
|------|-----------|------|---------|
| `main` | Código en producción | — | — |
| `develop` | Integración de features | `main` | `main` |
| `feat/*` | Nueva funcionalidad | `develop` | `develop` |
| `fix/*` | Corrección de bugs | `develop` | `develop` |
| `bugfix/*` | Hotfix urgente | `main` | `main` + `develop` |

**Ramas activas en el repositorio:**
- `master` (equivalente a `main`)
- `develop`
- `feat/32-pago-controller-y-service`, `feat/33-cancelacion-reembolso-services`
- `fix/34-checkout-service-bugs`, `fix/35-cart-frontend-integration`, `fix/40-checkout-json-exception`
- `docs/readme-y-tareas`

### A.5 .gitignore

El archivo `.gitignore` ya está configurado para excluir:

```
# Java
backend/target/, *.class, *.jar, *.war, *.log

# Node
frontend/node_modules/, frontend/dist/

# IDE
.idea/, *.iml, .vscode/

# OS
.DS_Store, Thumbs.db

# Environment
.env, .env.local
```

---

## B. Colaboración en GitHub

### B.1 Sincronización Local-Remoto

```bash
# Clonar el repositorio (solo una vez por developer)
git clone https://github.com/patitasJPP/Antonela_arts_sistema.git
cd Antonela_arts_sistema

# Actualizar con los cambios del equipo
git pull origin develop

# Subir cambios propios
git add .
git commit -m "feat: implementar módulo X"
git push origin feat/mi-rama
```

### B.2 Flujo Básico de Trabajo en Equipo

1. **`git pull origin develop`** — siempre antes de empezar
2. **Crear rama**: `git checkout -b feat/XX-descripcion`
3. **Trabajar** con commits frecuentes
4. **Subir rama**: `git push origin feat/XX-descripcion`
5. **Crear Pull Request** en GitHub hacia `develop`
6. **Asignar reviewer** a otro developer
7. **Resolver comentarios** si los hay
8. **Mergear** tras aprobación
9. **Eliminar rama** remota y local

### B.3 Invitación de Miembros y Permisos

Para agregar un colaborador al repositorio:

1. Ir a GitHub → Settings → Collaborators → Add people
2. Ingresar el email o username de GitHub del developer
3. Seleccionar permiso: **Write** (para push a ramas) o **Read** (solo visualización)
4. El invitado recibe un email con el enlace para aceptar

Para este proyecto, los 5 developers deben tener permisos **Write**.

---

## C. Issues y Seguimiento de Incidentes

### C.1 Creación de Issues

Cada tarea del plan debe tener un issue en GitHub antes de comenzar a codificar:

| Campo | Ejemplo |
|-------|---------|
| Título | `[Stripe] Crear StripeService con sesiones de pago` |
| Descripción | Explicar qué hace la tarea, archivos a modificar, endpoints |
| Labels | `backend`, `pagos` |
| Assignee | El developer asignado |
| Project | (opcional) kanban board |

**Labels disponibles:**

| Label | Color | Uso |
|-------|-------|-----|
| `backend` | 🔵 azul | Tareas backend |
| `frontend` | 🟢 verde | Tareas frontend |
| `devops` | ⚫ negro | Configuración y deploy |
| `bug` | 🔴 rojo | Reporte de error |
| `enhancement` | 🟣 morado | Mejora sobre código existente |
| `high priority` | 🟠 naranja | Tareas críticas |
| `pagos` | 🟡 amarillo | Stripe |
| `notificaciones` | 🔵 celeste | Twilio/Email |
| `admin` | 🔶 naranja | Panel admin |

### C.2 Ciclo de Vida de un Bug Report

1. **Detectar el error** → tomar **captura de pantalla (antes)**
2. **Crear issue** con label `bug`, descripción del problema, pasos para reproducir
3. **Asignar responsable** (assignee)
4. **Crear rama** `fix/XX-descripcion`
5. **Codificar la solución**
6. **Crear PR** vinculado: `Closes #XX`
7. **Solicitar review** a otro developer
8. **Mergear** a develop tras aprobación
9. **Tomar captura de pantalla (después)** mostrando el error resuelto
10. **Cerrar issue** automáticamente al mergear el PR

### C.3 Vinculación entre Issues, Commits y PRs

Para que GitHub enlace automáticamente:

- **En el commit:** `feat: implementar dashboard (#42)`
- **En el PR:** `Closes #42` en la descripción
- **En el PR:** `Fixes #15` para bugs

Cuando el PR se mergea a `main` o `develop`, el issue se cierra automáticamente.

### C.4 Ejemplos de Issues del Proyecto Real

| # | Estado | Título | Labels |
|---|--------|--------|--------|
| 42 | OPEN | Problemas con imagenes | `bug`, `frontend` |
| 35 | OPEN | [Cart] Integrar carrito frontend con CartContext | `bug`, `frontend` |
| 34 | OPEN | [Cart] Corregir bugs en CheckoutService | `bug`, `backend` |
| 33 | OPEN | [Booking] Refactor: servicios de cancelacion y reembolso | `enhancement`, `backend` |
| 32 | CLOSED | [Payment] Crear PagoController y completar ServicioPago | `backend`, `high priority` |
| 3 | CLOSED | Problemas con el login | `bug` |

---

## D. Pull Requests y Revisión de Código

### D.1 Proceso de Pull Request

1. **Crear PR** desde la rama de trabajo hacia `develop`
2. **Título descriptivo**: `feat: implementar StripeService con sesiones de pago`
3. **Descripción**: explicar qué cambios se hicieron y por qué, incluir `Closes #XX`
4. **Asignar reviewer**: otro developer (nunca uno mismo)
5. **Esperar revisión**: el reviewer comenta, sugiere cambios, aprueba
6. **Resolver comentarios**: si hay sugerencias, hacer commits adicionales
7. **Mergear**: solo tras la aprobación del reviewer

### D.2 Importancia del PR en la Calidad del Código

- **Detección temprana de bugs** antes de llegar a producción
- **Consistencia de estilo** entre todos los developers
- **Conocimiento compartido** del código (no solo una persona entiende cada parte)
- **Documentación viva** de las decisiones técnicas (los comentarios en PRs quedan registrados)
- **Trazabilidad**: cada cambio queda vinculado a un issue y una discusión

### D.3 PRs del Proyecto Real

| # | Título | Rama | Estado |
|---|--------|------|--------|
| 43 | se pudo reparar temporalmente las imagenes | `fix/correcion_bug` | MERGED |
| 40 | fix: agregar throws JsonProcessingException | `fix/40-checkout-json-exception` | MERGED |
| 39 | fix: integrar Products.tsx con CartContext | `fix/35-cart-frontend-integration` | MERGED |
| 38 | fix: corregir CheckoutService | `fix/34-checkout-service-bugs` | MERGED |
| 37 | feat: crear CancelacionService y ReembolsoService | `feat/33-cancelacion-reembolso-services` | MERGED |
| 36 | feat: agregar PagoController y completar ServicioPago | `feat/32-pago-controller-y-service` | MERGED |

---

## E. Capturas de Pantalla (tarea final)

Al completar el proyecto, cada developer debe tomar las siguientes capturas:

| # | Captura de | Quién | Formato sugerido |
|---|------------|-------|------------------|
| E.1 | Historial de ramas en GitHub (vista graph) | Dev 5 | `screenshots/ramas-github.png` |
| E.2 | Un PR completo con comentarios y aprobación | Cada dev | `screenshots/pr-N-{nombre}.png` |
| E.3 | Issue con bug report (antes + después) | Cada dev | `screenshots/issue-N-antes.png`, `screenshots/issue-N-despues.png` |
| E.4 | Pipeline de CI ejecutado exitosamente | Dev 5 | `screenshots/ci-pipeline.png` |
| E.5 | Pipeline de CD ejecutado (deploy automático) | Dev 5 | `screenshots/cd-pipeline.png` |
| E.6 | Sitio desplegado funcionando en la nube | Dev 5 | `screenshots/sitio-produccion.png` |

> Todas las capturas se almacenan en una carpeta `screenshots/` en la raíz del proyecto.

---

## F. CI/CD — Integración y Entrega Continua

### F.1 ¿Qué es CI/CD?

- **CI (Integración Continua)**: Cada vez que un developer hace push o crea un PR, el código se compila y se construye automáticamente para detectar errores temprano.
- **CD (Entrega Continua)**: Cada vez que se mergea código a `main`, el sistema se despliega automáticamente en producción.

### F.2 Workflow de CI (`.github/workflows/ci.yml`)

Creado por Dev 5 (tarea 5.9). Se ejecuta en cada `push` y `pull_request` a `main`/`develop`:

```
Trigger: push o PR a main/develop
  ├── job: backend → mvn compile (Java 21, Maven)
  └── job: frontend → npm ci + npm run build (Node 20)
```

### F.3 Workflow de CD (`.github/workflows/cd.yml`)

Creado por Dev 5 (tarea 5.10). Se ejecuta al hacer push a `main`:

```
Trigger: push a main
  ├── job: deploy-backend → curl a Render Deploy Hook
  └── job: deploy-frontend → vercel --prod
```

### F.4 Beneficios de CI/CD

| Beneficio | Explicación |
|-----------|-------------|
| **Detección temprana** | Los errores se detectan minutos después de escribir código |
| **Calidad garantizada** | El código siempre compila antes de llegar a producción |
| **Deploy automático** | No hay errores humanos al desplegar manualmente |
| **Rapidez** | De deploy manual (30 min) → automático (2 min) |
| **Trazabilidad** | Cada deploy queda registrado con su commit y autor |

---

## G. Plataformas en la Nube (Deploy)

### G.1 Plataformas Utilizadas

| Componente | Plataforma | Plan | Propósito |
|------------|-----------|------|-----------|
| **Frontend** | [Vercel](https://vercel.com) | Gratuito (Hobby) | Hosting SPA React |
| **Backend** | [Render](https://render.com) | Gratuito (Free) | Hosting Spring Boot |
| **Base de datos** | [Neon Tech](https://neon.tech) | Gratuito (Free) | PostgreSQL serverless |

### G.2 Enlaces del Proyecto Desplegado

| Recurso | URL |
|---------|-----|
| Frontend (Vercel) | `https://antonela-art-salon.vercel.app` |
| Backend API (Render) | `https://antonela-art-salon-api.onrender.com` |
| Health Check | `https://antonela-art-salon-api.onrender.com/api/health` |

### G.3 Proceso de Despliegue Inicial

**Backend (Render):**
1. Crear cuenta en https://render.com
2. Conectar repositorio GitHub
3. Crear Web Service:
   - Name: `antonela-art-salon-api`
   - Root Directory: `backend`
   - Build Command: `mvn clean package -DskipTests`
   - Start Command: `java -jar target/*.jar`
4. Configurar Environment Variables (las del `.env.team`)
5. Hacer clic en "Create Web Service"
6. Render builda y deploya automáticamente

**Frontend (Vercel):**
1. Crear cuenta en https://vercel.com
2. Importar repositorio GitHub
3. Configurar:
   - Framework Preset: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Agregar Environment Variable: `VITE_API_URL=https://antonela-art-salon-api.onrender.com/api`
5. Hacer clic en "Deploy"

**Base de datos (Neon):**
1. Crear cuenta en https://neon.tech
2. Crear proyecto `antonela-art-salon`
3. Seleccionar región (us-east-1 recomendado)
4. Copiar connection string
5. Ejecutar `database/init.sql` para crear tablas y seed data
