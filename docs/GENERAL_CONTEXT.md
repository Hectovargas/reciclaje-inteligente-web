# Documentación y Contexto General del Sistema (`reciclaje-inteligente-web`)

Este documento proporciona una visión panorámica y técnica del ecosistema **Reciclaje Inteligente Web**, sirviendo como guía de contexto global para desarrolladores y agentes de IA que trabajan en los distintos componentes del monorepo (Frontend, Backend, Smart Contracts y DevOps).

---

## 🎯 1. Visión General del Proyecto

**Reciclaje Inteligente Web** es una plataforma integral diseñada para optimizar y recompensar la clasificación y reciclaje automatizado de residuos mediante visión por computadora, tecnología blockchain y paneles de monitoreo en tiempo real.

El proyecto está estructurado como un **Monorepo `pnpm`** compuesto por las siguientes aplicaciones y paquetes:

```
reciclaje-inteligente-web/
├── apps/
│   ├── backend/          → NestJS + Prisma + PostgreSQL + JWT + Ethers.js (API REST & Web3 Integrator)
│   ├── dashboard/        → React 18 + Vite + TypeScript + Chart.js (Panel de Métricas de Administración)
│   └── pwa/              → Next.js 14 + Web3 SDK / Thirdweb + TypeScript (Aplicación PWA para Usuarios)
│
├── packages/
│   └── contracts/        → Solidity + Hardhat + OpenZeppelin (Smart Contracts ERC-20 Sepolia)
│
├── docker-compose.yml    → Orquestación de Contenedores (PostgreSQL, Vault, Backend, Dashboard Nginx)
├── pnpm-workspace.yaml   → Configuración de Workspaces de PNPM
├── package.json          → Scripts raíz del Monorepo
└── GENERAL_CONTEXT.md    → Este documento
```

---

## 📐 2. Arquitectura de Sistema y Flujos de Datos

```mermaid
flowchart TD
    subgraph Estaciones["🤖 Módulo de Visión / Estaciones IA"]
        Cam["Cámara + IA"] -->|POST /api/v1/clasificacion| API
    end

    subgraph UserSpace["📱 Espacio del Usuario"]
        PWA["PWA Mobile (Next.js - Port 3002)"]
        Wallet["Wallet Web3 (Privy / Thirdweb)"]
    end

    subgraph AdminSpace["📊 Espacio de Administración"]
        Dash["Dashboard Admin (Vite - Port 3001 / 8080)"]
    end

    subgraph BackendCore["⚙️ Backend Core (NestJS API - Port 3000)"]
        API["NestJS API REST /api/v1"]
        Auth["JWT Auth & Roles Guard"]
        QRSrv["Servicio QR (Firma Criptográfica)"]
        BcSrv["Blockchain Service (ethers.js)"]
    end

    subgraph Infrastructure["💾 Base de Datos e Infraestructura"]
        DB[(PostgreSQL 15 - Port 5433:5432)]
        Sepolia(("Ethereum Sepolia Testnet\nSmart Contract RECI"))
    end

    Dash -->|POST /api/v1/auth/login| Auth
    Dash -->|GET /api/v1/dashboard/*| API
    PWA -->|GET /api/v1/qr/verificar| QRSrv
    PWA <--> Wallet
    API <-->|Prisma ORM| DB
    BcSrv -->|mintPoints / ERC-20| Sepolia
```

### Flujos Principales de Operación:
1. **Flujo de Clasificación**: Estación inteligente clasifica un residuo (Papel, Plástico, Metal) -> Envía evento a `POST /api/v1/clasificacion` -> Se registra en PostgreSQL -> Actualiza métricas globales del Dashboard.
2. **Flujo de Recompensas y QR**: El backend genera tokens QR firmados digitalmente mediante `POST /api/v1/qr/generar` usando firmas elípticas. Los usuarios escanean el QR desde la PWA para validar sus reciclajes.
3. **Flujo Blockchain / ERC-20**: El backend actúa como administrador del contrato `RecompensasReciclaje.sol` en la testnet Sepolia de Ethereum, ejecutando la función `mintPoints()` para otorgar tokens `RECI` a la wallet del usuario tras confirmar reciclajes válidos.
4. **Flujo de Administración**: Los administradores inician sesión en el Dashboard (Vite/React) vía `/api/v1/auth/login`, reciben un JWT de sesión y monitorean gráficos de materiales, estado de estaciones y tasa de precisión de la IA.

---

## 🛠️ 3. Entorno de Desarrollo y Requisitos

### Requisitos de Software:
- **Node.js**: `v18.x` o `v20.x` (LTS recomendado).
- **Gestor de Paquetes**: `pnpm` (versión 8+ o 9+).
- **Base de Datos**: PostgreSQL 15+ (local o vía Docker).
- **Motor de Contenedores**: Docker Desktop / Docker Engine con Docker Compose.

---

## 🔌 4. Mapeo de Puertos y Servicios

| Servicio | Entorno Dev (`pnpm`) | Entorno Docker | Descripción |
|---|---|---|---|
| **NestJS Backend** | `http://localhost:3000` | `http://localhost:3000` | API REST principal y Swagger Docs (`/api/docs`) |
| **Admin Dashboard** | `http://localhost:3001` | `http://localhost:8080` | Panel de control web (Vite en dev, Nginx en Docker) |
| **User PWA** | `http://localhost:3002` | N/A (local node/docker option) | App cliente Next.js 14 PWA |
| **PostgreSQL DB** | `localhost:5432` | `localhost:5433` | Base de datos relacional PostgreSQL `recicla_db` |
| **HashiCorp Vault** | `http://localhost:8200` | `http://localhost:8200` | Gestión de secretos (`vault-init` inyecta llaves por defecto) |
| **Ethereum Sepolia** | Web3 RPC Remote | Web3 RPC Remote | Testnet de Ethereum para contrato ERC-20 `RECI` |

---

## 🔐 5. Variables de Entorno (`.env`)

### `apps/backend/.env`
```env
PORT=3000
DATABASE_URL="postgresql://root:rootpassword@localhost:5433/recicla_db?schema=public"
SEPOLIA_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY"
VAULT_ADDR="http://127.0.0.1:8200"
VAULT_TOKEN="root"
CONTRACT_ADDRESS="0x0000000000000000000000000000000000000000"
JWT_SECRET="super-secret-key-reciclaje"
```

### `packages/contracts/.env`
```env
SEPOLIA_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY"
PRIVATE_KEY="YOUR_WALLET_PRIVATE_KEY"
ETHERSCAN_API_KEY="YOUR_ETHERSCAN_API_KEY"
```

---

## 📜 6. Scripts Globales del Monorepo (`package.json`)

Desde la raíz del proyecto (`reciclaje-inteligente-web/`):

```bash
# Instalación de dependencias para todo el monorepo
pnpm install

# Ejecución en Desarrollo (Individual)
pnpm dev:backend      # Inicia NestJS backend en http://localhost:3000 (watch mode)
pnpm dev:dashboard    # Inicia Dashboard Vite en http://localhost:3001
pnpm dev:pwa          # Inicia PWA Next.js en http://localhost:3002

# Prisma ORM (Backend)
pnpm --filter backend exec prisma generate   # Genera cliente Prisma Client
pnpm --filter backend exec prisma migrate dev # Aplica migraciones en dev

# Smart Contracts (Solidity / Hardhat)
pnpm build:contracts   # Compila los contratos de Solidity
pnpm test:contracts    # Ejecuta pruebas unitarias de Hardhat

# Construcción para Producción Global
pnpm build             # Compila apps y packages
```

---

## 🐳 7. Ejecución con Docker Compose

El archivo `docker-compose.yml` en la raíz orquesta la infraestructura completa:

```bash
# Levantar la base de datos PostgreSQL, ejecutar migraciones, cargar seed y levantar Backend + Dashboard
docker compose up --build -d

# Ver logs en tiempo real
docker compose logs -f

# Detener los contenedores
docker compose down
```

### Credenciales por Defecto tras el Seed:
- **Usuario Administrador**: `admin@recicla.com`
- **Contraseña**: `admin123`
- **Rol**: `ADMIN`

---

## 🤝 8. Integraciones Clave entre Frontend, Backend y Blockchain

1. **Normalización de Estados de Estaciones (`StationStatus`)**:
   - En la DB PostgreSQL se almacenan como `ACTIVE`, `WARNING`, `OFFLINE`.
   - `DashboardService` los mapea a minúsculas (`active`, `warning`, `offline`) para coincidir con la interfaz TypeScript utilizada en `apps/dashboard/src/config/api.ts`.

2. **Manejo de Autenticación JWT**:
   - El login genera un token JWT con vigencia de 24h.
   - El Dashboard almacena el token en `sessionStorage.getItem('auth_token')` y lo envía en el header `Authorization: Bearer <token>`.

3. **Smart Contract `RecompensasReciclaje.sol` (ERC-20 `RECI`)**:
   - Nombre: **PuntosReciclaje** (`RECI`).
   - La función `mintPoints(address usuario, uint256 cantidad)` cuenta con restricción `onlyOwner`. Solo la clave privada del backend (`ADMIN_PRIVATE_KEY`) puede emitir tokens.

---

## ⚠️ 9. Limitaciones Conocidas y Decisiones de Arquitectura (MVP vs. Producción)

Es importante dejar constancia explícita de las siguientes decisiones de diseño para el alcance actual del MVP / Hackathon y sus correspondientes estrategias de mitigación para producción:

### 🔑 A. Punto Único de Falla en la Minter Wallet (`onlyOwner`)
- **Diagnóstico de Riesgo**: La clave privada está protegida en HashiCorp Vault para evitar fugas en texto plano (como `.env`) y es consumida asíncronamente por los servicios `Blockchain` y `QR` al inicio, pero sigue siendo una clave única para autorizar la llamada `mintPoints()` y generar firmas digitales.
- **Decisión MVP**: Se adopta HashiCorp Vault local para almacenamiento de secretos, mejorando la seguridad en todos los servicios core, pero manteniéndose como single-sig por simplicidad.
- **Mitigación para Producción**: 
  - Migrar la administración del Smart Contract a una billetera **Multisig (Gnosis Safe)**.
  - Delegar la ejecución de transacciones a un servicio de **Relayer / KMS / MPC** (como *OpenZeppelin Defender* o *AWS KMS*).
  - Implementar límites de emisión (rate-limiting on-chain/off-chain) por hora/día y mecanismos de rotación automatizada de llaves.

### 🛡️ B. Almacenamiento de JWT (24h) en `sessionStorage`
- **Diagnóstico de Riesgo**: Guardar tokens JWT con vigencia de 24 horas en el `sessionStorage` del navegador expone la sesión ante posibles ataques XSS (Cross-Site Scripting).
- **Decisión MVP**: Aceptado para simplificar la persistencia de sesión en desarrollo local entre el Dashboard/PWA y el Backend NestJS sin requerir configuración compleja de cookies en entornos HTTP.
- **Mitigación para Producción**:
  - Transportar tokens de sesión mediante **Cookies HTTP-Only, Secure y SameSite**.
  - Reducir la vigencia del Access Token a un periodo corto (15-30 minutos).
  - Implementar arquitectura de **Refresh Tokens** con rotación y revocación en servidor.

---

## 🔄 10. Flujo Post-Mint y Manejo de Transacciones On-Chain (Arquitectura Asíncrona con BullMQ + Redis)

El sistema utiliza una **arquitectura desacoplada y asíncrona mediante una cola de trabajo (BullMQ + Redis)** para evitar bloquear la interfaz del usuario mientras se procesan los bloques en la blockchain de Sepolia:

```mermaid
sequenceDiagram
    autonumber
    actor Usuario
    participant PWA as 📱 PWA (Next.js)
    participant API as ⚙️ Backend (NestJS)
    participant Queue as 📥 Cola BullMQ / Redis
    participant BC as ⛓️ BlockchainService / Worker
    participant Sepolia as 🌐 Sepolia Blockchain RPC

    Usuario->>PWA: Escanea QR / Solicita Canje
    PWA->>API: POST /api/v1/qr/verificar (Código QR + Wallet Address)
    API->>API: Valida firma digital del QR y marca token como usado
    API->>Queue: Encola trabajo de minteo { usuario, cantidad }
    API-->>PWA: HTTP 202 Accepted { status: "PROCESSING", txId: "job-123" }
    PWA->>Usuario: Muestra estado "Procesando Recompensa..." (sin bloqueo de UI)

    Queue->>BC: Worker procesa minteo en background
    BC->>Sepolia: Transacción mintPoints(usuarioAddress, cantidad)
    
    alt Transacción Exitosa en Sepolia
        Sepolia-->>BC: Transaction Receipt (txHash)
        BC->>Queue: Trabajo completado exitosamente
        alt Vía WebSocket / Polling
            API-->>PWA: Evento WS / Polling status: "COMPLETED", txHash
        else Consulta Directa
            PWA->>API: GET /api/v1/blockchain/balance/:address
            API-->>PWA: Balance actualizado (ej. 160.0 RECI)
        end
        PWA->>Usuario: Notificación "¡Tokens Recibidos!" + Balance Actualizado
    else Error On-Chain / Revert / Out of Gas
        Sepolia-->>BC: Error de Red / Revert
        BC->>Queue: Trabajo fallido -> Reintento con Backoff Exponencial
        Queue-->>PWA: Evento WS / Polling status: "FAILED" (si agota reintentos)
        PWA->>Usuario: Alerta "Error en procesamiento on-chain. Reintento disponible."
    end
```

### Principios de Resiliencia y Experiencia de Usuario:
1. **Respuesta Inmediata (HTTP 202 Accepted)**: El usuario no espera los 12-15 segundos que tarda un bloque en Sepolia. La PWA recibe el identificador del trabajo (`job-123`) inmediatamente.
2. **Reintentos con Backoff Exponencial**: Si el nodo RPC de Sepolia o Alchemy experimenta caídas intermitentes o problemas de estimación de gas, **BullMQ** reintenta la transacción automáticamente con retardos exponenciales.
3. **Gestión de Nonces Concurrente**: La cola procesa los trabajos secuencialmente o con concurrencia controlada, evitando colisiones de *nonce* en la wallet del administrador.
4. **Consulta de Saldo de Tokens**: La PWA o el cliente puede verificar el saldo actualizado en cualquier momento consumiendo `GET /api/v1/blockchain/balance/:address`.

---

## 📝 11. Estado de los Documentos de Contexto

Para un desglose detallado de cada componente, consultar los siguientes archivos dedicados:

- 📄 **Contexto General y Ambiente**: [`GENERAL_CONTEXT.md`](./GENERAL_CONTEXT.md) *(Este archivo)*
- ⚙️ **Contexto Backend**: [`BACKEND_CONTEXT.md`](./BACKEND_CONTEXT.md) *(Documentación detallada de NestJS, Swagger, Prisma y Endpoints)*
- 🎨 **Contexto Frontend**: [`FRONTEND_CONTEXT.md`](./FRONTEND_CONTEXT.md) *(Documentación detallada de Dashboard y PWA)*


