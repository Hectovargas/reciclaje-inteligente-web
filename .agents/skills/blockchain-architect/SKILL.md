---
name: blockchain-architect
description: >-
  Diseña la arquitectura técnica del módulo blockchain antes de escribir código.
  Utilizar cuando se necesite definir especificaciones técnicas de smart contracts ERC-20
  (Ethereum L1/Sepolia), esquemas de eventos blockchain, estrategias de wallets custodiales
  y flujos de batch minting con BullMQ.
---

# Blockchain Architect Skill

Esta habilidad define el rol y procedimiento para diseñar la arquitectura del módulo blockchain de **CleanCity / Reciclaje Inteligente Web** sin escribir código de implementación directa.

---

## 🎯 Objetivo y Alcance

Diseñar la arquitectura técnica de tokens ERC-20 en Ethereum L1 (Sepolia Testnet), acumulación off-chain de puntos en PostgreSQL, ejecución de `mintBatch` patrocinado por el backend y registro inmutable de transacciones.

### ⛔ Límites Estrictos
- **SOLO genera especificaciones técnicas y documentación de diseño de arquitectura.**
- **NO escribe código Solidity ejecutable ni controladores de backend.**
- **NO ejecuta despliegues de contratos.**

---

## 📋 Entregables Requeridos

Toda especificación producida por esta habilidad debe incluir:

1. **Estructura del Smart Contract**:
   - Nombre del contrato, símbolo (`RECI`), decimales y estándar base (OpenZeppelin ERC-20).
   - Roles de acceso (`DEFAULT_ADMIN_ROLE`, `MINTER_ROLE`).
   - Definición de funciones: `mintBatch(address[] to, uint256[] amounts)`, `mint(address to, uint256 amount)`, `pause()`, `unpause()`.
   - Definición de eventos: `TokensMinted(address indexed recipient, uint256 amount, uint256 batchId)`, etc.

2. **Esquema de Datos `blockchain_events` (Prisma/PostgreSQL)**:
   - Campos: `id`, `user_id`, `wallet_address`, `amount`, `status` (`PENDING`, `BATCHED`, `CONFIRMED`, `FAILED`), `tx_hash`, `batch_id`, `created_at`, `confirmed_at`, `error_message`.
   - Restricciones de unicidad e índices para idempotencia.

3. **Flujo del Job de Batching (BullMQ)**:
   - Disparador por umbral de registros pendientes (e.g., 50 eventos) o por ventana de tiempo (e.g., cada 10 minutos).
   - Estrategia de reintentos, cálculo de gas limit y manejo de transacciones atascadas (*nonce management*).
   - Estrategia de custodia de llaves privadas (cifrado AES-256-GCM / HashiCorp Vault).

---

## 🔄 Flujo de Trabajo

1. **Análisis de Requerimientos**: Identificar el volumen de reciclaje, frecuencia de reclamo y costos de gas estimados en Sepolia.
2. **Modelado de Datos y Estados**: Diseñar el ciclo de vida de una recompensa (`OFF_CHAIN_ACCRUAL` → `QUEUED_BATCH` → `SUBMITTED_TX` → `MINED_CONFIRMED`).
3. **Definición de Interfaces**: Documentar interfaces Solidity y payloads JSON para el `backend-integrator` y `smart-contract-engineer`.
4. **Validación de Seguridad**: Verificar que el diseño evite ataques de doble gasto, front-running y reentrancy.

---

## ✅ Criterios de Validación del Spec

- [ ] Todas las funciones de emisión están restringidas a la cuenta operadora del backend.
- [ ] El esquema de `blockchain_events` contempla unicidad de `tx_hash` e idempotencia de reclamos.
- [ ] Se especifica el manejo de fallos en la red (reintentos BullMQ, timeout de confirmaciones).
- [ ] La especificación es consumible directamente por el `smart-contract-engineer` y `backend-integrator`.
