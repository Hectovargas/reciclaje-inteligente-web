# Documentación y Contexto Técnico del Backend (`reciclaje-inteligente-web`)

Este documento sirve como guía de contexto técnico, arquitectura, endpoints y análisis de seguridad del backend para desarrolladores y agentes de IA.

---

## 🛠️ Tecnologías y Arquitectura

- **Framework**: NestJS (TypeScript)
- **Base de Datos y ORM**: PostgreSQL mediante Prisma ORM
- **Gestor de Monorepo**: `pnpm` Workspaces (`apps/*`, `packages/*`)
- **Autenticación**: JWT (`passport-jwt`) firmado con `JWT_SECRET`
- **Expiración de Tokens**: `1d` (24 horas). *No existe mecanismo de Refresh Token implementado actualmente.*
- **Documentación API**: Swagger / OpenAPI expuesto en `/api/docs`
- **Prefijo Global de Rutas**: `/api/v1`
- **Seguridad y Middleware Globales**:
  - `helmet` para cabeceras HTTP seguras
  - CORS activado
  - Pino Logger (`nestjs-pino`)
  - Rate Limiting estricto por ruta mediante `@nestjs/throttler`:
    - Global por defecto: 100 req / 60s por IP
    - `POST /api/v1/auth/login`: **5 req / 60s** por IP (`@Throttle`)
    - `POST /api/v1/qr/generar`: **10 req / 60s** por IP (`@Throttle`)
    - `GET /api/v1/qr/verificar`: **20 req / 60s** por IP (`@Throttle`)
  - `ValidationPipe` global con sanitización activa (`whitelist: true, transform: true`)
  - `AllExceptionsFilter` para captura estandarizada de errores HTTP y Prisma

---

## 🔒 Análisis Crítico de Seguridad, Limitaciones y Recomendaciones

> [!CAUTION]
> **1. Endpoint `POST /api/v1/qr/generar` (Mitigado)**
> - **Estado actual**: Protegido con `StationTokenGuard`. Solo estaciones válidas pueden generarlos.

> [!WARNING]
> **2. Expiración (TTL) en Tokens QR (`QRToken`) (Mitigado)**
> - **Estado actual**: El modelo `QRToken` incluye el campo `expiresAt`. `QrService` almacena el token al generarlo y valida expiración (10 min) y uso en `verificarQR()`.

> [!WARNING]
> **3. Credenciales Seed de Desarrollo (Advertencia)**
> - **Usuario de prueba**: `admin@recicla.com` / `admin123` (Rol `ADMIN`).
> - **Uso**: Únicamente válido para entornos de desarrollo local y testing. **PROHIBIDO su uso en entornos de producción o staging público**. Debe cambiarse mediante variables de entorno o migración segura.

> [!IMPORTANT]
> **4. Almacenamiento de Token JWT en Frontend (`httpOnly` Cookie)**
> - **Decisión de arquitectura actual**: El token se almacena de forma segura usando una cookie `httpOnly`, protegiendo a los usuarios contra ataques XSS.
> - **Fallback**: El backend soporta leer el token desde el header `Authorization: Bearer <token>` temporalmente por retrocompatibilidad.

> [!NOTE]
> **5. Mitigación de Fuerza Bruta y Scraping de QR (Resuelto)**
> - **Implementado**: Se configuraron decoradores `@Throttle` dedicados:
>   - `POST /api/v1/auth/login`: Máximo 5 intentos por minuto (mitiga fuerza bruta de contraseñas).
>   - `POST /api/v1/qr/generar`: Máximo 10 peticiones por minuto.
>   - `GET /api/v1/qr/verificar`: Máximo 20 consultas por minuto (mitiga scraping/DoS de la tabla `QRToken`).

> [!TIP]
> **6. Gestión de Secretos con HashiCorp Vault (Resuelto)**
> - **Implementado**: La clave privada `ADMIN_PRIVATE_KEY` ya no se guarda en texto plano (`.env`). El sistema utiliza HashiCorp Vault local, del cual tanto `BlockchainService` como `QrService` obtienen la clave de forma asíncrona al inicializarse mediante `VAULT_ADDR` y `VAULT_TOKEN`, garantizando que nunca quede hardcodeada.

---

## 📁 Estructura del Código Backend (`apps/backend/src`)

```
apps/backend/src/
├── app.module.ts              # Módulo principal con imports globales
├── main.ts                    # Punto de entrada, configuración NestJS, Swagger y Pipes
├── auth/                      # Autenticación, JWT, Guards y Decoradores
│   ├── auth.controller.ts     # POST /api/v1/auth/login (Protegido con Rate Limit 5 req/min)
│   ├── auth.service.ts        # Validación bcrypt y firma de JWT (expira en 1d)
│   ├── jwt.strategy.ts        # Estrategia Passport JWT
│   ├── guards/                # JwtAuthGuard y RolesGuard
│   └── decorators/            # Decorador @Roles(Role.ADMIN, ...)
├── clasificacion/             # Registro e historial de eventos de clasificación IA
│   ├── clasificacion.controller.ts # POST (registro) y GET (historial paginado)
│   └── clasificacion.service.ts
├── dashboard/                 # Métricas agregadas y estado de estaciones
│   ├── dashboard.controller.ts# GET /dashboard/metrics, GET /dashboard/stations
│   └── dashboard.service.ts   # Agregación de métricas y normalización de datos
├── qr/                        # Generación y verificación de tokens QR
│   ├── qr.controller.ts       # POST /qr/generar (10 req/min), GET /qr/verificar (20 req/min)
│   └── qr.service.ts          # Firma digital criptográfica con ethers.js
├── blockchain/                # Integración con Sepolia Testnet y Smart Contracts
│   ├── blockchain.service.ts  # Minting de puntos RECI (ERC20) y consulta de saldos
│   └── blockchain.module.ts
├── health/                    # Endpoint de salud del sistema
│   ├── health.controller.ts   # GET /api/v1/health (Terminus: Memoria y Base de Datos)
│   └── health.module.ts
├── prisma/                    # Servicio PrismaClient
└── common/                    # Filtros de excepción globales y logger
```

---

## 🗄️ Modelo de Datos (Prisma Schema)

Definido en [`apps/backend/prisma/schema.prisma`](./apps/backend/prisma/schema.prisma):

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String   // Encriptado con bcrypt
  name      String
  role      Role     @default(VIEWER) // ADMIN | MANAGER | VIEWER
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Zone {
  id        String    @id @default(uuid())
  name      String    @unique
  stations  Station[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Station {
  id        String                @id @default(uuid())
  name      String
  location  String
  status    StationStatus         @default(ACTIVE) // ACTIVE | WARNING | OFFLINE
  capacity  Int                   @default(100)
  token     String?               @unique
  zoneId    String
  zone      Zone                  @relation(fields: [zoneId], references: [id])
  events    EventoClasificacion[]
}

model EventoClasificacion {
  id        String   @id @default(uuid())
  categoria String   // Papel, Plástico, Metal
  confianza Float
  stationId String
  station   Station  @relation(fields: [stationId], references: [id])
  timestamp DateTime @default(now())
}

model QRToken {
  id        String   @id @default(uuid())
  codigo    String   @unique
  categoria String
  usado     Boolean  @default(false)
  firma     String
  timestamp DateTime @default(now())
  expiresAt DateTime
}
```

---

## 🌐 Endpoints y Rutas Principales (`/api/v1`)

| Método | Endpoint | Protegido | Roles | Rate Limit | Descripción |
|---|---|---|---|---|---|
| `GET` | `/api/v1/health` | ❌ No | Todos | 100 req/min | Estado del sistema (Prisma DB ping + Memoria Heap) |
| `POST` | `/api/v1/auth/login` | ❌ No | Todos | **5 req/min** | Autenticación con email/password. Retorna user data y setea cookie httpOnly `access_token` |
| `POST` | `/api/v1/auth/logout` | ❌ No | Todos | 100 req/min | Limpia la cookie segura `access_token` |
| `GET` | `/api/v1/dashboard/metrics` | ✅ Sí | ADMIN, MANAGER, VIEWER | 100 req/min | Métricas, desglose de materiales, precisión IA y heatmap |
| `GET` | `/api/v1/dashboard/stations` | ✅ Sí | ADMIN, MANAGER, VIEWER | 100 req/min | Estaciones con estado normalizado (`active`, `warning`, `offline`) |
| `POST` | `/api/v1/clasificacion` | ✅ Sí | Estación (StationToken) | **30 req/min** | Registro de evento de clasificación desde estación IA. Devuelve evento + QR |
| `GET` | `/api/v1/clasificacion` | ✅ Sí | ADMIN, MANAGER, VIEWER | 100 req/min | Consulta paginada de eventos (`?page=1&limit=20`) |
| `POST` | `/api/v1/qr/generar` | ✅ Sí | Estación (StationToken) | **10 req/min** | Genera token QR firmado criptográficamente |
| `GET` | `/api/v1/qr/verificar` | ❌ No | Todos | **20 req/min** | Valida firma digital de token QR y expiración (`?codigo=...&firma=...`) |
| `GET` | `/api/docs` | ❌ No | Todos | Sin límite | Documentación interactiva Swagger OpenAPI |

---

## 🔑 Criptografía y Payload del Token QR (`/api/v1/qr`)

### Algoritmo de Firma
La firma digital del QR utiliza **Ethers v6** (`solidityPackedKeccak256`) con la clave privada de administración (`ADMIN_PRIVATE_KEY`):

$$\text{hash} = \text{keccak256}\Big(\text{codigo} \mathbin{\Vert} \text{categoria} \mathbin{\Vert} \text{timestamp}\Big)$$

### Estructura de Respuesta del Payload QR
{
  "codigo": "QR-PLÁSTICO-1786479000000",
  "categoria": "Plástico",
  "firma": "0x1234567890abcdef...",
  "usado": false,
  "timestamp": "2026-08-11T20:25:00.000Z",
  "expiresAt": "2026-08-11T20:35:00.000Z"
}
```

---

## 📡 Contrato de Comunicación ESP32 (Estación IA)

Para enviar eventos de clasificación desde la estación, el ESP32 debe realizar una petición HTTP con el siguiente contrato:

**Endpoint:** `POST /api/v1/clasificacion`

**Headers Requeridos:**
- `Content-Type: application/json`
- `x-station-token: <TOKEN_DE_LA_ESTACION_EN_BD>`

**Body (JSON):**
```json
{
  "categoria": "Plástico",
  "confianza": 0.95,
  "stationId": "<ID_UUID_DE_LA_ESTACION>"
}
```

**Respuesta Esperada (201 Created):**
```json
{
  "id": "uuid-evento-...",
  "categoria": "Plástico",
  "confianza": 0.95,
  "stationId": "uuid-estacion",
  "timestamp": "2026-08-12T...",
  "qr": {
    "codigo": "QR-PLÁSTICO-1786479000000",
    "categoria": "Plástico",
    "firma": "0x12...",
    "usado": false,
    "timestamp": "2026-08-12T...",
    "expiresAt": "2026-08-12T..."
  }
}
```

---

## 💥 Formato Estándar de Errores (Body Response)

Todos los errores no capturados o excepciones HTTP procesados por [`AllExceptionsFilter`](./apps/backend/src/common/filters/all-exceptions.filter.ts) devuelven una estructura JSON uniforme:

```json
{
  "statusCode": 401,
  "timestamp": "2026-08-11T20:13:26.199Z",
  "path": "/api/v1/dashboard/metrics",
  "message": "Unauthorized",
  "code": "HTTP_EXCEPTION"
}
```

### Códigos HTTP de Error Comunes
- `400 BAD_REQUEST`: Datos de entrada inválidos (`ValidationPipe`) o error de base de datos (`PRISMA_ERROR_*`).
- `401 UNAUTHORIZED`: JWT ausente, expirado o credenciales de login inválidas.
- `403 FORBIDDEN`: El usuario autenticado no posee el rol necesario (`RolesGuard`).
- `404 NOT_FOUND`: Recurso no encontrado (`PRISMA_NOT_FOUND`).
- `409 CONFLICT`: Violación de restricción única (`PRISMA_UNIQUE_CONSTRAINT`), e.g., email duplicado.
- `429 TOO_MANY_REQUESTS`: Exceso de peticiones en la ventana del Rate Limiter (e.g. >5 req/min en login).
- `500 INTERNAL_SERVER_ERROR`: Error interno no controlado del servidor (`INTERNAL_ERROR`).

---

## ⚡ Comandos Útiles de Ejecución y Desarrollo

```bash
# 1. Instalar dependencias del monorepo
pnpm install

# 2. Generar el cliente de Prisma (Obligatorio tras cambios de schema)
pnpm --filter backend prisma:generate

# 3. Iniciar el servidor backend en modo desarrollo (Watch mode)
pnpm dev:backend

# 4. Compilar producción NestJS
pnpm --filter backend build

# 5. Ejecutar migraciones / seed de base de datos
pnpm --filter backend prisma:deploy
```

### Ejecución vía Docker
```bash
docker compose up --build -d
```
