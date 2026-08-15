---
name: qa-tester
description: >-
  Escribe suites de tests unitarios, de integración y E2E sobre el código ya implementado.
  Utilizar cuando se requiera aumentar la cobertura de pruebas en el backend NestJS (Jest/Supertest),
  smart contracts (Hardhat/Chai) y frontends (Vitest/Testing Library) sin modificar lógica de negocio.
---

# QA Tester Skill

Esta habilidad guía la creación, ejecución y mantenimiento de pruebas automatizadas en todo el monorepo **CleanCity / Reciclaje Inteligente Web**.

---

## 🎯 Objetivo y Alcance

Garantizar la estabilidad, confiabilidad y ausencia de regresiones en la plataforma mediante la creación sistemática de tests unitarios, de integración y flujos punta a punta (*E2E*).

### ⛔ Límites Estrictos
- **SOLO escribe y ejecuta archivos de test (`*.spec.ts`, `*.test.ts`, `*.test.tsx`, `*.spec.js`).**
- **NO modifica la lógica de negocio ni archivos de código fuente de la aplicación.**
- **Si un test falla debido a un bug en la lógica, documenta el fallo sin alterar el código de producción.**

---

## 🧪 Áreas de Cobertura y Herramientas

### 1. Backend NestJS (`apps/backend`) - Jest & Supertest
- **Tests Unitarios de Servicios**:
  - `AuthService`: Hashing de contraseñas, emisión de JWT, validación de credenciales.
  - `QrService`: Firma criptográfica, validación de firmas y detección de tokens expirados/usados.
  - `BlockchainService`: Cifrado y descifrado de llaves custodiales, armado de payloads `mintBatch`.
- **Tests de Integración de Controladores (Supertest)**:
  - Endpoints protegidos por guards (`JwtAuthGuard`, `RolesGuard`).
  - Flujo de activación de estación ESP32 por MAC y token.
  - Idempotencia en el reclamo de recompensas.

### 2. Smart Contracts (`packages/contracts`) - Hardhat & Chai
- Control de acceso para funciones `mint` y `mintBatch`.
- Reversión por parámetros inválidos o arrays desbalanceados.
- Validación de eventos emitidos e incremento de balances.

### 3. Frontends (`apps/dashboard` & `apps/pwa`) - Vitest & React Testing Library
- Renderizado de componentes clave (`StatCard`, `ZoneHeatmap`, `QRScanner`).
- Manejo de estados de carga, error y respuestas vacías de la API.
- Validación de formularios y redirecciones de autenticación.

---

## 🔄 Flujo de Trabajo

1. **Identificar Áreas Críticas**: Evaluar módulos con baja cobertura mediante `pnpm test:cov`.
2. **Diseño de Casos de Prueba**: Redactar casos nominales (*happy path*), casos límite (*edge cases*) y condiciones de error (*negative testing*).
3. **Implementación de Mocks y Fixtures**: Utilizar mocks aislados para Prisma ORM, Redis, proveedores RPC de Ethereum y servicios externos.
4. **Ejecución y Verificación**: Ejecutar la suite correspondiente:
   - Backend: `pnpm --filter backend test`
   - Contracts: `pnpm --filter contracts test`
   - Frontend: `pnpm --filter dashboard test` o `pnpm --filter pwa test`
5. **Reporte de Calidad**: Emitir resumen de tests aprobados, cobertura alcanzada y defectos detectados.
