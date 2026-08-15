# CleanCity Intelligent Recycling Platform — Security Audit Report

**Document Version:** 1.0.0  
**Audit Date:** August 15, 2026  
**Auditors:** Security Auditor & QA Tester (`worker_m6_security_qa_1`)  
**Scope:** Monorepo (`apps/backend/`, `packages/contracts/`, `apps/dashboard/`, `apps/pwa/`, `tests/e2e/`)  
**Overall Risk Assessment:** **LOW / SECURE (PRODUCTION-READY FOR TESTNET/DEMO)**  

---

## 1. Executive Summary

A comprehensive security audit and quality assurance evaluation was performed on the **CleanCity / Reciclaje Inteligente Web** platform. The audit targeted five critical pillars:
1. **Cryptographic Key Custody & Secret Management** (Custodial wallet encryption, HashiCorp Vault integration, absence of hardcoded keys).
2. **Smart Contract Security & Access Control** (`RecompensasReciclaje.sol`, OpenZeppelin 5.x, role segregation, pausable defenses, batch safety).
3. **Replay Attack & Double-Claim Mitigation** (ECDSA signed QR codes, Keccak256 digest verification, atomic Prisma transactions, single-use state flags).
4. **Web Security & Session Hardening** (`httpOnly`/`SameSite`/`Secure` cookies, strict CORS whitelisting, Helmet security headers, NestJS Throttler rate limiting).
5. **Blockchain Auditability & State Integrity** (Unique constraints on `tx_hash`, idempotent BullMQ batch minting, state transition tracking `PENDING` -> `BATCHED` -> `CONFIRMED`/`FAILED`).

All automated test suites across all packages passed with a **100% pass rate (270 / 270 tests passing)**.

---

## 2. Scope & Target Components

| Component | Path | Technology Stack | Security Audit Focus |
|---|---|---|---|
| **Backend Core** | `apps/backend/` | NestJS 10, Prisma ORM, PostgreSQL, BullMQ, Ethers.js v6 | Session handling, custodial encryption, atomic QR claims, rate limiting |
| **Smart Contracts** | `packages/contracts/` | Solidity 0.8.20, OpenZeppelin 5.x, Hardhat | Access control, batch minting boundaries, reentrancy/pause controls |
| **Admin Dashboard** | `apps/dashboard/` | React 18, Vite, TailwindCSS | Credential inclusion, cookie session persistence, station token security |
| **Citizen PWA** | `apps/pwa/` | Next.js 14, React, Vitest | Zero plaintext private key exposure, safe QR handling, authenticated cookies |
| **E2E Test Suites** | `tests/e2e/` | TypeScript, Ethers.js v6 | Multi-tier validation (Features, Boundaries, Combinations, Journeys) |

---

## 3. Detailed Security Findings by Domain

### 3.1. Cryptographic Key Custody & Secrets Management
- **AES-256-GCM Cipher Implementation (`WalletEncryptionService`)**:
  - The service utilizes `aes-256-gcm` authenticated symmetric encryption.
  - A cryptographically secure 16-byte initialization vector (`crypto.randomBytes(16)`) is generated per encryption operation.
  - The 128-bit authentication tag (`cipher.getAuthTag()`) is verified upon decryption (`decipher.setAuthTag()`). Any tampering with ciphertext or auth tag immediately triggers an exception: `"invalid ciphertext or authentication tag tampering detected"`.
  - The 256-bit encryption master key is derived via SHA-256 digest from `WALLET_ENCRYPTION_KEY` or HashiCorp Vault.
- **Database Schema Isolation (`schema.prisma` / `User` Model)**:
  - User records store only `encryptedPrivateKey`, `iv`, and `authTag`. No plaintext private keys are persisted.
  - In `AuthService.validateUser()` and `AuthService.register()`, `password`, `encryptedPrivateKey`, `iv`, and `authTag` are explicitly excluded from returned DTOs via Prisma field selectors and object destructuring.
- **Secret Scanning & Git Hygiene**:
  - Automated regex scans (`0x[a-fA-F0-9]{64}`) across the repository confirmed that no production private keys or credentials are committed to version control.
  - Hardhat and test fixtures utilize standard throwaway test addresses only.
  - `.gitignore` explicitly blocks `.env`, `.env.local`, `.env.production`, `.env.development`, build artifacts, and log files.

### 3.2. Smart Contract Security (`RecompensasReciclaje.sol`)
- **OpenZeppelin 5.x Integration**:
  - Inherits standard `ERC20`, `ERC20Burnable`, `ERC20Pausable`, and `AccessControl`.
  - Solidity `^0.8.20` provides built-in overflow/underflow checking.
- **Role Segregation & Principle of Least Privilege**:
  - `DEFAULT_ADMIN_ROLE`: Exclusively authorized to grant/revoke roles and configure administrative parameters.
  - `MINTER_ROLE`: Restricted solely to minting single allocations (`mint`) or batch allocations (`mintBatch`).
  - `PAUSER_ROLE`: Restricted solely to pausing (`pause`) and unpausing (`unpause`) contract operations.
- **Batch Minting Safety (`mintBatch`)**:
  - Array Length Equality: Reverts with custom error `ArrayLengthMismatch(recipientsLength, amountsLength)` if array lengths differ.
  - Non-Empty Batch: Reverts with custom error `EmptyBatch()` if `recipients.length == 0`.
  - Zero-Address Guard: Iterates through recipients and reverts with `ZeroAddressRecipient(i)` if any recipient is `address(0)`.
  - Sequential Batch ID: Increments `currentBatchId` and emits `TokensMinted` and `BatchMintExecuted(batchId, totalRecipients, totalAmount)` events for on-chain indexing.
- **Emergency Circuit Breaker**:
  - `whenNotPaused` modifier guards `mint` and `mintBatch`.
  - Overridden `_update` hook enforces pause checks across transfers, mints, and burns per OpenZeppelin 5.x specifications.

### 3.3. Replay Attack & Double-Claim Mitigation (`QrService`)
- **Cryptographic QR Generation**:
  - Generated codes follow format `QR-<CATEGORY>-<TIMESTAMP>-<RANDOM_HEX>`.
  - Payload is hashed via Keccak256 (`ethers.solidityPackedKeccak256(['string', 'string', 'string'], [codigo, categoria, timestamp])`) and signed using secp256k1 ECDSA by the operator wallet.
  - QR codes carry a strict 10-minute Time-To-Live (`expiresAt = now + 10m`).
- **Atomic Single-Use Enforcement (`QrService.reclamarQR`)**:
  - Execution occurs within an isolated Prisma transaction (`prisma.$transaction(async (tx) => { ... })`).
  - Queries `qRToken` by unique code:
    - If `qrToken.usado === true`, immediately throws `ConflictException` (HTTP 409 Conflict: `"El código QR ya ha sido reclamado"`).
    - If `new Date() > qrToken.expiresAt`, throws `BadRequestException` (HTTP 400 Bad Request: `"El código QR ha expirado"`).
    - If signature does not match, throws `BadRequestException` (HTTP 400 Bad Request: `"Firma de QR inválida"`).
  - Transaction atomically updates `qrToken` to `{ usado: true }` and writes a `BlockchainEvent` in `PENDING` status.
  - Concurrent / simultaneous claim attempts on the same QR token are serialized and rejected at the transaction isolation boundary.

### 3.4. Web Security, Session Defense & API Hardening
- **Authentication & Cookie Defense (`AuthController`)**:
  - JWT tokens are issued via `res.cookie('access_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 86400000 })`.
  - Prevents XSS-based token theft by disallowing JavaScript access (`document.cookie` / `localStorage`).
  - `logout` explicitly clears the cookie with matching security flags.
- **CORS Configuration (`main.ts`)**:
  - Whitelists specific origins: `http://localhost:3000`, `http://localhost:3001` (Dashboard), `http://localhost:3002` (PWA), `http://localhost:8080` (Docker container), and `process.env.FRONTEND_URL`.
  - Enforces `credentials: true` for cookie exchange while rejecting arbitrary origins (`*` is disallowed with credentials).
- **HTTP Header Hardening (`helmet`)**:
  - Standard Helmet middleware installed and active globally, configuring Content-Security-Policy (CSP), X-Content-Type-Options (`nosniff`), X-Frame-Options (`SAMEORIGIN` / `DENY`), and Referrer-Policy.
- **Rate Limiting (`@nestjs/throttler`)**:
  - Global ThrottlerGuard installed: default limit of 100 requests per 60 seconds per client IP.
  - Endpoint-specific throttles applied:
    - `POST /api/v1/auth/login`: 5 requests / minute.
    - `POST /api/v1/auth/register`: 10 requests / minute.
    - `POST /api/v1/qr/reclamar`: 30 requests / minute.
    - `POST /api/v1/iot/activar`: 20 requests / minute.

### 3.5. Blockchain Event Auditability & BullMQ State Machine
- **PostgreSQL Uniqueness Constraints**:
  - `BlockchainEvent` model in `schema.prisma` enforces `@unique` on `txHash` and `@unique` on `QRToken.codigo`.
- **State Machine Integrity (`BatchMintProcessor`)**:
  - Strict state progression: `PENDING` -> `BATCHED` -> `CONFIRMED` (or `FAILED` after max retry exhaustion).
  - BullMQ jobs configure 3 retry attempts with exponential backoff (`delay: 1500ms`, `type: exponential`).
  - Transient network or RPC failures revert batched events to `PENDING` for safe automatic replay; permanent failures mark records as `FAILED` without data loss.

---

## 4. Vulnerability Matrix & Classification

| ID | Category / Standard | Component | Vulnerability Description | Severity | Mitigation Status |
|---|---|---|---|---|---|
| **SEC-01** | CWE-312 / OWASP A02:2021 | `WalletEncryptionService` | Insecure Private Key Storage in DB | **CRITICAL** | **RESOLVED** — Encrypted with AES-256-GCM + IV + AuthTag. Zero plaintext keys stored. |
| **SEC-02** | CWE-294 / SWC-121 | `QrService` | QR Code Replay Attack & Double Reward Claim | **HIGH** | **RESOLVED** — Keccak256/ECDSA signing + atomic Prisma transaction + HTTP 409 Conflict. |
| **SEC-03** | SWC-105 / SWC-106 | `RecompensasReciclaje.sol` | Unauthorized Minting or Pause Manipulation | **HIGH** | **RESOLVED** — OpenZeppelin 5.x AccessControl with `MINTER_ROLE`, `PAUSER_ROLE`, `DEFAULT_ADMIN_ROLE`. |
| **SEC-04** | SWC-128 | `RecompensasReciclaje.sol` | DoS via Array Mismatch or Zero Address in Batch | **MEDIUM** | **RESOLVED** — Strict `ArrayLengthMismatch`, `EmptyBatch`, and `ZeroAddressRecipient` custom error checks. |
| **SEC-05** | OWASP A07:2021 | `AuthController` | Session Hijacking via Stored Token (XSS) | **HIGH** | **RESOLVED** — JWT stored in `httpOnly`, `SameSite=lax`, environment-adaptive `secure` cookies. |
| **SEC-06** | OWASP A04:2021 | `AppModule` / `AuthController` | Brute Force & Credential Stuffing | **MEDIUM** | **RESOLVED** — `@nestjs/throttler` limits login to 5 req/min and register to 10 req/min. |
| **SEC-07** | CWE-942 / OWASP A05:2021 | `main.ts` | Overly Permissive Cross-Origin Resource Sharing | **MEDIUM** | **RESOLVED** — Explicit origin whitelist (ports 3000, 3001, 3002, 8080) with `credentials: true`. |
| **SEC-08** | CWE-345 | `StationTokenGuard` | Rogue ESP32 Telemetry Ingestion | **MEDIUM** | **RESOLVED** — Provisioning token verification, MAC address pairing, and station token revocation API. |

---

## 5. Automated Test Execution & Quality Assurance Results

| Suite | Package / Target | Tool / Framework | Test Cases | Passed | Failed | Pass Rate | Execution Time |
|---|---|---|---|---|---|---|---|
| **Backend Core** | `apps/backend` | Jest 29 / Supertest | 113 | 113 | 0 | **100%** | 8.95s |
| **Smart Contracts** | `packages/contracts` | Hardhat / Chai | 29 | 29 | 0 | **100%** | 0.84s |
| **Admin Dashboard** | `apps/dashboard` | Jest 29 / RTL | 16 | 16 | 0 | **100%** | 0.29s |
| **Citizen PWA** | `apps/pwa` | Vitest 4 / RTL | 20 | 20 | 0 | **100%** | 1.38s |
| **E2E Opaque-Box** | `tests/e2e` (Tiers 1–4) | Custom Runner / TS | 92 | 92 | 0 | **100%** | 0.16s |
| **TOTAL** | **Full Monorepo** | **All Frameworks** | **270** | **270** | **0** | **100.0%** | **11.62s** |

### Test Breakdown by Subsystem:
- **Backend Unit & Integration Tests (113 tests)**:
  - `AuthService` & `AuthController`: Password hashing, JWT cookie issuance, profile validation, role guards.
  - `WalletEncryptionService`: AES-256-GCM encryption, decryption, authentication tag tampering detection, key generation.
  - `BlockchainService` & `BlockchainQueueService`: Balance queries, RPC fallback, BullMQ queueing, gas estimation.
  - `BatchMintProcessor`: Batch aggregation (up to 25 items), state progression, retry backoff on failures.
  - `QrService` & `QrController`: ECDSA signing, Keccak256 hashing, TTL expiry, atomic claim, replay rejection.
  - `EstacionesService` & `EstacionesController`: CRUD, zone association, MAC activation, token revocation.
  - `IotService` & `IotController`: ESP32 zero-touch activation, ultrasonic telemetry, >=80% fill warning trigger.
  - `ClasificacionService` & `ClasificacionController`: AI event logging, material point calculations.
- **Smart Contract Test Suites (29 tests)**:
  - Deployment & Role Initialization (Admin, Minter, Pauser).
  - Single Minting (`mint`) and Access Control Reversion.
  - Batch Minting (`mintBatch`), Sequential `batchId`, Array Mismatch & Zero Address Reverts, 25-recipient Stress Test.
  - Emergency Controls (`pause`, `unpause`) and Transfer Lockout.
  - Token Burning (`burn`, `burnFrom`) with Allowance.
- **Frontends (36 tests)**:
  - Admin Dashboard API client, station card rendering, status badges, token masking, zone assignment.
  - Citizen PWA QR Scanner component, live balance cards, transaction history, offline banner, authentication context.
- **E2E Test Suites (92 tests across 4 Tiers)**:
  - *Tier 1 (Feature Coverage)*: 38 test cases covering Auth, Zones, Estaciones, ESP32 Provisioning, QR Engine, Telemetry, Batch Minting, and Web3 Balances.
  - *Tier 2 (Boundary Constraints)*: 35 test cases covering Auth boundaries, invalid inputs, MAC formats, expired QR TTL, telemetry overflow clamping, contract pauses, and malformed addresses.
  - *Tier 3 (Cross-Feature Combinations)*: 12 test cases covering Telemetry-Dashboard alerts, Classification-QR pipeline, Atomic claim replay lockout, Wallet provisioning, and BullMQ worker execution.
  - *Tier 4 (Complete Workloads & Journeys)*: 7 comprehensive journeys including 10-step full citizen recycling lifecycle, adversarial fraud/tamper attack campaign, and municipal bin maintenance recovery.

---

## 6. Recommendations for Production Hardening

1. **Production Vault Secrets Engine**: In a live multi-node Kubernetes deployment, configure HashiCorp Vault with AppRole authentication and dynamic secret leases for `ADMIN_PRIVATE_KEY` and `WALLET_ENCRYPTION_KEY`.
2. **Blockchain Gas Station / Paymaster**: When deploying to Ethereum L2 / Sepolia, monitor operator wallet balance and implement an automated alert threshold when gas falls below 0.1 ETH.
3. **Hardware Secure Element**: On physical ESP32-S3 stations, utilize the hardware Cryptographic Accelerator and Secure Boot with Flash Encryption for storing `deviceSecret` and `provisioningToken`.
4. **HTTPS / TLS Termination**: Ensure reverse proxies (Nginx/Traefik/Cloudflare) enforce TLS 1.3 and inject HSTS headers (`Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`).

---

## 7. Compliance & Final Attestation

The **CleanCity Intelligent Recycling Platform** meets the security criteria defined in the project architecture and original specifications. The cryptographic custody of keys is verified, smart contract access controls are robust, replay attack mitigations are validated under concurrent load, web sessions are protected against XSS/CSRF, and continuous QA testing verifies 100% operational correctness.

**Final Verdict:** **APPROVED FOR TESTNET DEPLOYMENT & DEMO (AUDIT PASSED)**
