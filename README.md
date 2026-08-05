# Reciclaje Inteligente Web

Monorepo para el ecosistema **Reciclaje Inteligente Web**, estructurado para gestionar el panel de monitoreo de administración, la aplicación PWA para usuarios finales, el backend con NestJS y Prisma, y los contratos inteligentes en la testnet Sepolia de Ethereum.

---

## 📁 Estructura del Monorepo

```text
reciclaje-inteligente-web/
├── apps/
│   ├── dashboard/          → React + Vite + TypeScript + Chart.js (Panel de Métricas)
│   ├── pwa/                → Next.js (PWA) + Web3 SDK / Privy / Thirdweb + TypeScript
│   └── backend/            → NestJS + Prisma + PostgreSQL + Ethers.js
│       └── src/
│           ├── clasificacion/   (HTTP POST para eventos del módulo de visión)
│           ├── dashboard/       (Endpoints de métricas agregadas)
│           ├── qr/              (Generación de QR con firma criptográfica)
│           ├── blockchain/      (Interacción con Smart Contract vía ethers.js)
│           └── prisma/          (Conexión e integración con PostgreSQL)
│
├── packages/
│   └── contracts/          → Solidity + Hardhat + OpenZeppelin
│       ├── contracts/RecompensasReciclaje.sol   (ERC-20 "PuntosReciclaje", Sepolia)
│       ├── scripts/        (Script de despliegue a Sepolia)
│       └── test/           (Pruebas unitarias del Smart Contract)
│
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

---

## 🛠️ Requisitos Previos

- **Node.js**: `v18.x` o superior (se recomienda v20+)
- **Gestor de paquetes**: `pnpm` (`npm install -g pnpm` o vía `corepack enable`)
- **Base de Datos**: PostgreSQL para el backend NestJS/Prisma

---

## 🚀 Instalación y Configuración Inicial

1. **Clonar el repositorio e instalar dependencias:**
   ```bash
   pnpm install
   ```

2. **Configurar variables de entorno:**
   - En `apps/backend/`: Copia `.env.example` a `.env` y ajusta `DATABASE_URL` y las llaves de Sepolia/Admin.
   - En `packages/contracts/`: Copia `.env.example` a `.env` y define `SEPOLIA_RPC_URL` y `PRIVATE_KEY`.

3. **Generar esquema de Prisma (Backend):**
   ```bash
   pnpm --filter backend exec prisma generate
   ```

---

## 💻 Comandos de Desarrollo

Puedes ejecutar cada servicio individualmente usando los scripts configurados en el `package.json` raíz:

### 1. Panel Dashboard (`apps/dashboard`)
Servidor de desarrollo Vite en `http://localhost:3001`:
```bash
pnpm dev:dashboard
```

### 2. Aplicación PWA (`apps/pwa`)
Servidor de desarrollo Next.js en `http://localhost:3002`:
```bash
pnpm dev:pwa
```

### 3. Backend NestJS (`apps/backend`)
Servidor de desarrollo NestJS en `http://localhost:3000`:
```bash
pnpm dev:backend
```

### 4. Smart Contracts (`packages/contracts`)
Comprar y probar contratos inteligentes:
```bash
# Compilar contratos Solidity
pnpm build:contracts

# Ejecutar pruebas unitarias Hardhat
pnpm test:contracts

# Desplegar a Ethereum Sepolia testnet
pnpm --filter contracts deploy:sepolia
```

---

## 📜 Modelos Iniciales de Prisma

El backend cuenta con los siguientes modelos principales definidos en `schema.prisma`:
- **`EventoClasificacion`**: `id`, `categoria`, `confianza`, `zona`, `timestamp`
- **`QRToken`**: `id`, `codigo`, `categoria`, `usado`, `firma`, `timestamp`

---

## 💎 Contrato ERC-20 `RecompensasReciclaje`

El contrato `RecompensasReciclaje.sol` implementa un token ERC-20 llamado **PuntosReciclaje** (`RECI`), con restricción `onlyOwner` en la función:
```solidity
function mintPoints(address usuario, uint256 cantidad) external onlyOwner
```
Esto asegura que únicamente la wallet administradora (del backend de Reciclaje Inteligente) pueda emitir o recompensar con puntos a los usuarios tras validar sus acciones de reciclaje.
