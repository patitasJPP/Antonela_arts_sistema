# Credenciales y Acceso a Servicios Externos

## Cuenta Compartida

| Campo | Valor |
|-------|-------|
| Correo | `antonelaartutp@gmail.com` |
| Contraseña | AntonelaArtUTP12345// |

---

## Servicios Externos

### 1. Stripe (Pagos)
- **URL:** https://dashboard.stripe.com
- **Modo:** TEST
- **Qué configurar:**
  - Obtener API keys (Secret Key `sk_test_...`, Publishable Key `pk_test_...`)
  - Configurar Webhook endpoint: `https://tu-api.onrender.com/api/webhook/stripe`
  - Escuchar evento: `checkout.session.completed`
  - Copiar Webhook Secret (`whsec_...`)
- **Variables:**
  - `STRIPE_SECRET_KEY`
  - `STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_WEBHOOK_SECRET`

### 2. Twilio (WhatsApp)
- **URL:** https://twilio.com
- **Qué configurar:**
  - Crear cuenta y verificar número de teléfono
  - Ir a Console > Account SID
  - Usar Sandbox WhatsApp para pruebas (whatsapp:+14155238886)
  - Unir el número de pruebas al sandbox
- **Variables:**
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_WHATSAPP_NUMBER`

### 3. Neon Tech (Base de Datos)
- **URL:** https://neon.tech
- **Qué configurar:**
  - Crear proyecto "antonela-art-salon"
  - Región: US East
  - Copiar connection string
  - Ejecutar `database/init.sql` para crear tablas y seed data
- **Variables:**
  - `DB_URL`
  - `DB_USER`
  - `DB_PASSWORD`

### 4. Render (Backend)
- **URL:** https://render.com
- **Qué configurar:**
  - Crear Web Service conectando el repositorio GitHub
  - Root Directory: `backend`
  - Build Command: `mvn clean package -DskipTests`
  - Start Command: `java -jar target/*.jar`
  - Configurar Environment Variables en Render Dashboard
  - Copiar Deploy Hook URL para CD
- **Variables:**
  - Todas las variables de entorno (no subir al repo)

### 5. Vercel (Frontend)
- **URL:** https://vercel.com
- **Qué configurar:**
  - Importar repositorio GitHub
  - Framework Preset: Vite
  - Root Directory: `frontend`
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - Agregar Environment Variable: `VITE_API_URL`
  - Generar Token personal para CD (Vercel Settings > Tokens)
- **Variables:**
  - `VITE_API_URL=https://antonela-art-salon-api.onrender.com/api`

### 6. Gmail SMTP (Correo)
- **URL:** https://myaccount.google.com/apppasswords
- **Qué configurar:**
  - Usar la cuenta compartida `antonelaartutp@gmail.com`
  - Generar contraseña de aplicación para "Correo"
  - Usar `smtp.gmail.com` puerto 587 con TLS
- **Variables:**
  - `MAIL_USERNAME`
  - `MAIL_PASSWORD`

---

## Variables de Entorno Completo

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

> **Importante:** No subir este archivo ni el `.env.team` al repositorio. Las variables reales se configuran directamente en Render Dashboard y Vercel Dashboard.
