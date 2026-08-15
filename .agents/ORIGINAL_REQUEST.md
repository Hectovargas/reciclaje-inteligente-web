# Original User Request

## Initial Request — 2026-08-15T06:21:29Z

Construye el módulo blockchain y las funcionalidades pendientes del proyecto Estación de Reciclaje Inteligente (CleanCity), orquestando el monorepo (NestJS, Prisma, PostgreSQL, Docker, React/Vite, Next.js PWA, Hardhat, ERC-20, BullMQ) respetando el flujo de trabajo entre los roles especializados de .agents/skills/.

Working directory: /home/fefo/Documentos/GitHub/reciclaje-inteligente-web
Integrity mode: demo

## Requirements

### R1. Backend Core & REST APIs (Estaciones, Zonas, Auth)
- Implementar el CRUD de estaciones de reciclaje y asignación a zonas urbanas fijas en NestJS y Prisma.
- Implementar la activación automática de estaciones ESP32 al recibir el primer ping (`POST /api/v1/estaciones/activar` o `/api/v1/iot/ping`), vinculando MAC y provisioning token para cambiar su estado de `PENDING_ACTIVATION` a `ACTIVE`.
- Asegurar autenticación JWT gestionada mediante cookies `httpOnly`, `Secure`, `SameSite` en `/api/v1/auth/*` (login, register, logout, me).

### R2. Blockchain Architecture & Smart Contracts (ERC-20 Sepolia)
- Generar la especificación técnica formal del smart contract ERC-20 (`RECI`) con soporte de batch minting (`mintBatch`), roles de control de acceso (`DEFAULT_ADMIN_ROLE`, `MINTER_ROLE`), pausable y eventos de emisión.
- Implementar el contrato en Solidity (`packages/contracts/contracts/RecompensasReciclaje.sol`) con OpenZeppelin, scripts de despliegue y suite exhaustiva de tests en Hardhat.

### R3. Web3 Backend Integration & BullMQ Batch Minting
- Implementar en NestJS la gestión segura y cifrada de wallets custodiales (AES-256-GCM / HashiCorp Vault).
- Implementar colas de trabajo asíncronas con BullMQ (`apps/backend`) para batch minting periódico o por umbral de reciclajes acumulados, evitando colisiones de nonce y asegurando idempotencia.
- Persistir y auditar cada transacción en la tabla `blockchain_events` con unicidad de `tx_hash` y trazabilidad de estado (`PENDING`, `BATCHED`, `CONFIRMED`, `FAILED`).

### R4. Admin Dashboard & User PWA Interfaces
- Refinar el Dashboard administrativo (React/Vite) con visualización de métricas en tiempo real, desglose de materiales clasificados, estado de sensores/estaciones y gestión de zonas.
- Actualizar la aplicación PWA (Next.js) con flujo completo de escaneo y validación de QR, consulta de saldo en tokens `RECI` e historial de transacciones.

### R5. IoT Sensor Integration & Cryptographic QR Verification
- Implementar los endpoints de telemetría de nivel de llenado de contenedores y generación de códigos QR firmados criptográficamente (ECDSA) para evitar reclamos fraudulentos.

### R6. Continuous QA Testing & Security Auditing
- Escribir tests unitarios y de integración incrementales (NestJS/Supertest, Hardhat, React) acompañando cada entregable de los ingenieros.
- Ejecutar auditoría de seguridad sobre custodia de claves, sanitización de inputs, protección CSRF/XSS y mitigación de doble reclamo en blockchain.

### R7. Technical Report & System Documentation
- Redactar el Informe Técnico final consolidando la arquitectura implementada, decisiones de diseño, esquemas de datos, endpoints Swagger y manual de despliegue.

## Acceptance Criteria

### Backend & API
- [ ] Endpoints de autenticación emiten y validan cookies `httpOnly` sin exponer tokens JWT en `localStorage`.
- [ ] La activación de estaciones ESP32 por MAC + token transiciona el estado a `ACTIVE` automáticamente.
- [ ] Endpoints de Zonas y Estaciones responden correctamente con validación de DTOs (`class-validator`) y documentación Swagger (`/api/docs`).

### Blockchain & Smart Contracts
- [ ] Contrato `RecompensasReciclaje.sol` compila sin advertencias en Hardhat y pasa el 100% de los tests unitarios (mint, mintBatch, pause, roles).
- [ ] Worker BullMQ procesa en lote las solicitudes de emisión y actualiza el estado de `blockchain_events`.
- [ ] Las llaves privadas operadoras se almacenan cifradas (AES-256-GCM / Vault) y las transacciones registran `tx_hash` único.

### Frontend & IoT
- [ ] El Dashboard de administración muestra estadísticas en tiempo real y gestiona estaciones y zonas sin errores de consola.
- [ ] La PWA permite al usuario escanear QR firmado, validar reciclaje y consultar balance de tokens.
- [ ] Endpoint de telemetría IoT actualiza la capacidad de la estación y dispara alertas preventivas de vaciado.

### QA, Seguridad y Documentación
- [ ] Suites de pruebas automatizadas ejecutan y pasan para backend (`pnpm test`), contratos (`pnpm hardhat test`) y frontends.
- [ ] Auditoría de seguridad confirma ausencia de secretos en texto plano y mitigación de repetición/replay attacks.
- [ ] Documento `INFORME_TECNICO.md` redactado detallando arquitectura, flujos y métricas del sistema CleanCity.
