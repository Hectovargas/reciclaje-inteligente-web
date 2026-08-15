---
name: backend-integrator
description: >-
  Conecta smart contracts desplegados con el backend NestJS, Prisma y PostgreSQL.
  Utilizar para implementar generación de wallets custodiales cifradas, colas BullMQ
  para batch minting de tokens ERC-20, y sincronización de eventos y estados blockchain.
---

# Backend Integrator Skill

Esta habilidad guía la integración entre el backend NestJS (`apps/backend`), la base de datos PostgreSQL mediante Prisma ORM, y los contratos inteligentes desplegados en Ethereum Sepolia para el ecosistema **CleanCity / Reciclaje Inteligente Web**.

---

## 🎯 Objetivo y Alcance

Automatizar la custodia segura de llaves, el procesamiento por lotes de transacciones blockchain mediante colas asíncronas (**BullMQ / Redis**) y el seguimiento del ciclo de vida de los eventos on-chain.

### ⛔ Límites Estrictos
- **Trabaja exclusivamente en `apps/backend` (NestJS, Prisma, BullMQ, Ethers.js/Viem).**
- **NO modifica código Solidity en `packages/contracts`.**
- **NO almacena jamás llaves privadas en texto plano en base de datos ni en logs.**

---

## ⚙️ Componentes de Integración

### 1. Wallets Custodiales
- Al registrar un nuevo usuario en `apps/backend/src/auth/` o `src/users/`:
  - Generar un par de llaves criptográficas compatibles con EVM (`ethers.Wallet.createRandom()`).
  - Cifrar la llave privada usando AES-256-GCM con una llave maestra proveniente de variables de entorno seguras / HashiCorp Vault.
  - Almacenar la dirección pública (`wallet_address`) y la llave cifrada (`encrypted_private_key`, `iv`, `auth_tag`) en la tabla `User` o `CustodialWallet`.

### 2. Procesamiento Batch con BullMQ (`apps/backend/src/blockchain/`)
- **Productor (*Producer*)**:
  - Al confirmarse un reciclaje o reclamo de puntos, insertar un registro en `blockchain_events` con estado `PENDING`.
- **Consumidor (*Consumer / Worker*)**:
  - Ejecutar un job programado (cron o trigger de volumen) que agrupe hasta $N$ eventos `PENDING`.
  - Construir y firmar la transacción `mintBatch(addresses, amounts)` utilizando la cuenta operadora del backend (`ADMIN_PRIVATE_KEY`).
  - Transmitir la transacción al RPC de Sepolia, almacenar el `tx_hash` y actualizar el estado a `BATCHED`.

### 3. Sincronización y Confirmación
- Esperar las confirmaciones de bloque (`tx.wait(1)` o worker de reconciliación).
- Actualizar `blockchain_events` a `CONFIRMED` o `FAILED` (con registro detallado del error).

---

## 🔄 Flujo de Trabajo

1. **Definición de Esquema Prisma**: Verificar que el modelo `BlockchainEvent` y los campos de wallet custodial estén sincronizados con `prisma/schema.prisma`.
2. **Servicio Blockchain (`BlockchainService`)**: Configurar proveedor RPC (Infura / Alchemy), instancia del contrato con su ABI y gestión de *nonces*.
3. **Queue & Processor**: Implementar `BlockchainProcessor` en BullMQ con control de reintentos exponenciales y alertas ante fallos de gas.
4. **Validación de Idempotencia**: Comprobar que ningún evento pueda ser procesado más de una vez ante reintentos de la cola.

---

## ✅ Criterios de Validación

- [ ] Las llaves privadas custodiales se cifran antes de persistir en PostgreSQL.
- [ ] El worker de BullMQ agrupa eficientemente registros `PENDING` llamando a `mintBatch`.
- [ ] La tabla `blockchain_events` refleja de manera fidedigna los estados `PENDING` → `BATCHED` → `CONFIRMED` / `FAILED`.
- [ ] Se gestiona el gas limit y los nonces evitando colisiones en transacciones simultáneas.
