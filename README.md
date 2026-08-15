# CleanCity — Plataforma de Reciclaje Inteligente Web

Ecosistema integral de **Reciclaje Inteligente** (*CleanCity*), estructurado como un monorepo modular (`pnpm workspaces`) que combina hardware IoT (ESP32), visión artificial para clasificación de residuos, API Backend en NestJS con colas BullMQ, contratos inteligentes ERC-20 en Ethereum Sepolia, Centro de Control de Administración en React/Vite y Progressive Web App (PWA) móvil para ciudadanos en Next.js.

---

## 📑 Documentación Técnica y Reportes

Para información arquitectónica y de ingeniería detallada, consulte los documentos en [`docs/`](./docs/README.md):

- 📘 **[INFORME_TECNICO.md](./docs/INFORME_TECNICO.md):** Informe Técnico Final completo (Resumen Ejecutivo R1–R7, Planteamiento y Justificación, 5 Cuadros Comparativos, 5 Diagramas Mermaid, Catálogo OpenAPI/Swagger, Especificación Solidity, Auditoría de Seguridad y Guía de Demostración).
- 🌐 **[GENERAL_CONTEXT.md](./docs/GENERAL_CONTEXT.md):** Visión panorámica del monorepo, topología de servicios y puertos.
- ⚙️ **[BACKEND_CONTEXT.md](./docs/BACKEND_CONTEXT.md):** Contexto técnico de la API NestJS, Prisma y BullMQ.
- 📱 **[FRONTEND_CONTEXT.md](./docs/FRONTEND_CONTEXT.md):** Contexto del Dashboard React y la PWA Next.js.
- 🧪 **[TEST_INFRA.md](./docs/TEST_INFRA.md):** Metodología de la infraestructura de pruebas (*Opaque-Box E2E* y suites unitarias/integración).
- 🛡️ **[SECURITY_AUDIT.md](./docs/SECURITY_AUDIT.md):** Reporte formal de auditoría de seguridad, mitigación de amenazas y custodia de claves.

---

## 📁 Estructura del Monorepo

```text
reciclaje-inteligente-web/
├── apps/
│   ├── backend/            → API NestJS 10 + Prisma ORM + PostgreSQL + Redis/BullMQ + Ethers.js v6
│   │   └── src/
│   │       ├── auth/            (Autenticación JWT en cookies httpOnly + Custodia de Wallets)
│   │       ├── estaciones/      (CRUD de estaciones, asignación de zonas y rotación de tokens)
│   │       ├── zones/           (Gestión de zonas urbanas fijas)
│   │       ├── iot/             (Activación Zero-Touch ESP32 y telemetría ultrasónica)
│   │       ├── qr/              (Generación Keccak256/ECDSA y canje atómico transaccional)
│   │       ├── clasificacion/   (Ingesta de eventos de visión artificial por IA)
│   │       ├── blockchain/      (Ethers.js v6, cifrado AES-256-GCM y worker BullMQ mintBatch)
│   │       └── prisma/          (Esquema relacional y migraciones PostgreSQL)
│   ├── dashboard/          → React 18 + Vite 5 + TypeScript + TailwindCSS + Chart.js (EcoGridAI)
│   └── pwa/                → Next.js 14 (App Router) + html5-qrcode + Web3 Balance + Service Worker
│
├── packages/
│   └── contracts/          → Solidity 0.8.20 + Hardhat 2.19 + OpenZeppelin Contracts v5
│       ├── contracts/RecompensasReciclaje.sol   (ERC-20 "RECI", mintBatch, Pausable, AccessControl)
│       ├── scripts/deploy.ts                    (Script de despliegue a Sepolia y exportación de ABI)
│       └── test/                                (Suite de 29 pruebas unitarias con 100% de cobertura)
│
├── docs/                   → Centro de documentación técnica, reportes y especificaciones
├── tests/
│   └── e2e/                → Suite de pruebas E2E Opaque-Box en 4 Tiers (91 casos de prueba)
│
├── docker-compose.yml       → Orquestación de PostgreSQL (5433), Redis (6379), Vault (8200) y Backend
├── pnpm-workspace.yaml      → Configuración de paquetes del monorepo
├── package.json
└── README.md
```

---

## 🚀 Inicio Rápido con Docker Compose

La forma más rápida de levantar toda la infraestructura del sistema (Base de datos PostgreSQL, Broker Redis, HashiCorp Vault, Backend NestJS y Dashboard):

```bash
# 1. Clonar el repositorio e instalar dependencias
git clone https://github.com/Hectovargas/reciclaje-inteligente-web.git
cd reciclaje-inteligente-web
pnpm install

# 2. Iniciar todos los servicios con Docker Compose
docker compose up -d

# 3. Verificar el estado de los contenedores
docker compose ps
```

### Puertos y Servicios Disponibles:
- 🌐 **PWA Móvil Ciudadana:** `http://localhost:3002`
- 📊 **Centro de Control (Dashboard):** `http://localhost:3001` (o `http://localhost:8080`)
- ⚙️ **API REST NestJS:** `http://localhost:3000`
- 📖 **Swagger OpenAPI UI:** `http://localhost:3000/api/docs`
- 🐘 **PostgreSQL DB:** `localhost:5433` (`recicla_db`)
- ⚡ **Redis Broker:** `localhost:6379`
- 🔒 **HashiCorp Vault:** `http://localhost:8200`

---

## 💻 Ejecución en Modo Desarrollo Local (Sin Docker)

Si prefieres ejecutar los servicios directamente en tu entorno local:

### 1. Inicialización de Base de Datos y Dependencias
```bash
# Instalar dependencias globales del monorepo
pnpm install

# Generar el cliente de Prisma ORM
pnpm --filter backend prisma:generate

# Compilar los contratos inteligentes de Hardhat
pnpm build:contracts
```

### 2. Iniciar Servicios en Paralelo
Ejecuta cada comando en una terminal independiente:

```bash
# Terminal 1: Backend NestJS (Puerto 3000)
pnpm dev:backend

# Terminal 2: Admin Dashboard React/Vite (Puerto 3001)
pnpm dev:dashboard

# Terminal 3: User PWA Next.js 14 (Puerto 3002)
pnpm dev:pwa
```

---

## 🧪 Ejecución de Pruebas Automatizadas

El monorepo cuenta con **269 pruebas automatizadas** distribuidas en todas las capas del sistema con un **100% de tasa de aprobación**:

```bash
# 1. Pruebas Unitarias e Integración del Backend (113 tests)
pnpm --filter backend test

# 2. Pruebas de Smart Contracts y Cobertura Hardhat (29 tests - 100% Cobertura)
pnpm --filter contracts test
pnpm --filter contracts coverage

# 3. Pruebas de Componentes del Admin Dashboard (16 tests)
pnpm --filter dashboard test

# 4. Pruebas de Flujos y Componentes de la PWA Móvil (20 tests)
pnpm --filter pwa test

# 5. Suite Completa Opaque-Box E2E (91 tests en 4 Tiers)
bash tests/e2e/run_e2e.sh
```

---

## 💎 Smart Contract ERC-20 `RecompensasReciclaje.sol`

El contrato `RecompensasReciclaje.sol` gestiona el token oficial **CleanCity Reciclaje (`RECI`)** en la red Ethereum Sepolia:

- **Estándar:** ERC-20 OpenZeppelin v5 con 18 decimales.
- **Roles Criptográficos:**
  - `DEFAULT_ADMIN_ROLE`: Administración global y otorgamiento de roles.
  - `MINTER_ROLE`: Autorización exclusiva para emitir tokens (asignado a la wallet operadora del backend).
  - `PAUSER_ROLE`: Capacidad de congelar operaciones en situaciones de contingencia.
- **Emisión por Lotes (`mintBatch`):**
  ```solidity
  function mintBatch(
      address[] calldata recipients,
      uint256[] calldata amounts
  ) external onlyRole(MINTER_ROLE) whenNotPaused returns (uint256 batchId)
  ```
  Permite liquidar hasta 25 recompensas en una única transacción on-chain, reduciendo los costos de gas en más de un 70%.

---

## 📱 Guía Rápida para Demostración en Vivo (Demo Mode)

1. **Registro:** Ingrese a la PWA (`http://localhost:3002`) y cree una cuenta ciudadana. Se generará automáticamente una wallet custodial con clave cifrada en AES-256-GCM.
2. **Dashboard:** Ingrese al Dashboard (`http://localhost:3001`) con credenciales `admin@recicla.com` / `admin123` y visualice el mapa de calor por zonas.
3. **Aprovisionamiento IoT:** Cree una estación en estado `PENDING_ACTIVATION` y simule el encendido del ESP32 enviando su ping de activación (`POST /api/v1/estaciones/activar`). El estado cambiará automáticamente a `ACTIVE`.
4. **Clasificación y QR:** Simule la detección de plástico por visión artificial (`POST /api/v1/clasificacion/evento`). Se generará un código QR firmado criptográficamente con Keccak256/ECDSA.
5. **Canje de Puntos:** Escanee el código QR desde la cámara de la PWA. El backend ejecutará el canje atómico (prevención de replay attacks) y encolará la recompensa en BullMQ.
6. **Liquidación y Telemetría:** El worker procesará el lote y minteará tokens `$RECI` en el Smart Contract, incrementando el saldo del usuario en tiempo real. Finalmente, simule una lectura de llenado ($\ge 80\%$) para disparar la alerta `WARNING` en el Centro de Control.

---

## 📄 Licencia y Créditos

Desarrollado para el proyecto **CleanCity / Reciclaje Inteligente Web** (2026).  
Distribuido bajo la licencia MIT. Consulte `LICENSE` para más detalles.
