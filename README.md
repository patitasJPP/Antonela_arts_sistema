# Antonela Art Salon 🎀

Sistema web integral para la gestión de un salón de belleza. Permite a los clientes reservar citas, comprar productos, y al personal administrativo gestionar el calendario, inventario y tareas.

---

## Stack Tecnológico

### Backend
| Tecnología | Versión |
|-----------|---------|
| Java (OpenJDK) | 21+ (proyecto compilado con 24) |
| Spring Boot | 3.4.4 |
| Spring Security | 6.x (incluido en Spring Boot) |
| Spring Data JPA | 3.x (incluido en Spring Boot) |
| PostgreSQL | 18.4 |
| jjwt (JWT) | 0.12.6 |
| jqwik (property testing) | 1.9.2 |
| Lombok | 1.18.36 |
| Maven | 3.x |

### Frontend
| Tecnología | Versión |
|-----------|---------|
| Node.js | 20+ |
| React | 18.3.1 |
| TypeScript | 5.6.3 |
| Vite | 6.0.3 |
| React Router DOM | 6.28.0 |
| Axios | 1.7.9 |
| Jest | 30.x |
| React Testing Library | 16.x |
| Sass | 1.100.x |

---

## Requisitos previos

- **Java 21+** ([Descargar](https://adoptium.net/))
- **Node.js 20+** ([Descargar](https://nodejs.org/))
- **PostgreSQL 16+** ([Descargar](https://www.postgresql.org/download/))
- **Maven 3.x** ([Descargar](https://maven.apache.org/download.cgi))
- **Git** ([Descargar](https://git-scm.com/))

---

## Cómo descargar y ejecutar el proyecto

### 1. Clonar el repositorio

```bash
git clone https://github.com/patitasJPP/Antonela_arts_sistema.git
cd antonela-art-salon
```

### 2. Configurar la base de datos

```bash
# Conectar a PostgreSQL y crear la base de datos
psql -U postgres -c "CREATE DATABASE antonela_art_salon;"

# Ejecutar el script de inicialización
psql -U postgres -d antonela_art_salon -f database/init.sql
```

> **Credenciales por defecto:** usuario `postgres`, contraseña `noe123`
> Si tu PostgreSQL tiene otra contraseña, edítala en `backend/src/main/resources/application.properties`

### 3. Iniciar el backend

```bash
cd backend
mvn spring-boot:run
```

Esperar hasta que aparezca:
```
Started AntonelaArtApplication in X.XXX seconds
```

Verificar:
```bash
curl http://localhost:8080/api/health
# → {"status":"ok"}
```

> El backend corre en **http://localhost:8080**

### 4. Iniciar el frontend

```bash
cd frontend
npm install
npm run dev
```

> El frontend corre en **http://localhost:3000**

### 5. Abrir en el navegador

```
http://localhost:3000
```

---

## Estructura del proyecto

```
antonela-art-salon/
├── backend/                    # Spring Boot (Java)
│   ├── src/main/java/.../art/
│   │   ├── config/             # SecurityConfig, CorsConfig
│   │   ├── controller/         # Endpoints REST
│   │   ├── dto/                # Request/Response DTOs
│   │   ├── entity/             # Entidades JPA (13 tablas)
│   │   ├── exception/          # GlobalExceptionHandler
│   │   ├── repository/         # Repositorios JPA
│   │   ├── security/           # JwtUtil, JwtAuthenticationFilter
│   │   └── service/            # Lógica de negocio
│   └── pom.xml
├── frontend/                   # React + TypeScript (Vite)
│   ├── src/
│   │   ├── components/         # Componentes reutilizables
│   │   ├── contexts/           # AuthContext, CartContext
│   │   ├── layout/             # MainLayout, Navbar, Footer
│   │   ├── pages/              # admin/, auth/, client/, public/, shop/
│   │   ├── services/           # api.ts (axios)
│   │   ├── styles/             # global.css, index.scss
│   │   └── types/              # Interfaces TypeScript
│   └── package.json
├── database/
│   └── init.sql                # Schema + seed data
├── tests/                      # Tests (pendiente)
├── requirements.md
├── design.md
├── tasks.md
└── distribución de tareas.md
```

---

## Rutas del frontend

| Ruta | Página | Descripción |
|------|--------|-------------|
| `/` | Home | Página principal |
| `/services` | Servicios | Catálogo de servicios |
| `/products` | Productos | Catálogo de productos |
| `/gallery` | Galería | Galería de trabajos |
| `/booking` | Reservas | Formulario de reserva de citas |
| `/cart` | Carrito | Carrito de compras |
| `/login` | Login | Inicio de sesión cliente |
| `/register` | Register | Registro de cliente |
| `/client/panel` | Panel Cliente | Dashboard del cliente |
| `/admin/login` | Admin Login | Inicio de sesión admin |
| `/admin/calendar` | Calendario | Gestión de citas (admin) |
| `/admin/inventory` | Inventario | Gestión de precios (admin) |
| `/admin/tasks` | Tareas | Gestión de tareas (admin) |

---

## API Endpoints

### Salud
| Método | Ruta | Auth |
|--------|------|------|
| GET | `/api/health` | ❌ |

### Autenticación
| Método | Ruta | Auth |
|--------|------|------|
| POST | `/api/admin/login` | ❌ |
| POST | `/api/client/register` | ❌ |
| POST | `/api/client/login` | ❌ |
| POST | `/api/client/forgot-password` | ❌ |
| GET | `/api/client/validate-reset-token` | ❌ |
| POST | `/api/client/reset-password` | ❌ |

### Catálogos (públicos)
| Método | Ruta | Auth |
|--------|------|------|
| GET | `/api/services` | ❌ |
| GET | `/api/products?disponible=true` | ❌ |
| GET | `/api/gallery` | ❌ |

### Cliente (requiere token)
| Método | Ruta |
|--------|------|
| GET | `/api/client/appointments` |
| GET | `/api/client/profile` |
| GET | `/api/client/orders` |
| POST | `/api/cart/checkout` |

### Admin (requiere token)
| Método | Ruta |
|--------|------|
| GET | `/api/admin/appointments` |

---

## Usuarios por defecto (seed data)

**Admin:**
- Usuario: `admin`
- Contraseña: `admin123`

**Clientes:** no hay seed de clientes (deben registrarse desde el frontend).

---

## Comandos útiles

```bash
# Backend
cd backend
mvn compile              # Compilar
mvn spring-boot:run       # Ejecutar
mvn test                  # Ejecutar tests

# Frontend
cd frontend
npm install               # Instalar dependencias
npm run dev               # Ejecutar en desarrollo
npm run build             # Build producción
npm test                  # Ejecutar tests
npm run test:coverage     # Tests con cobertura
```
