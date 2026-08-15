---
name: backend-api-engineer
description: >-
  Implementa y mantiene endpoints REST en NestJS con Prisma ORM y PostgreSQL.
  Utilizar para desarrollar CRUD de estaciones y zonas fijas, activación automática de dispositivos
  ESP32 por MAC y token, y autenticación robusta mediante JWT almacenado en cookies httpOnly.
---

# Backend API Engineer Skill

Esta habilidad guía el diseño, implementación y refactorización de endpoints de la API REST en `apps/backend` (NestJS + Prisma + PostgreSQL) para **CleanCity / Reciclaje Inteligente Web**.

---

## 🎯 Objetivo y Alcance

Desarrollar controladores, servicios, DTOs y middlewares seguros y escalables para la administración de estaciones, zonas geográficas y autenticación con cookies seguras.

### ⛔ Límites Estrictos
- **Trabaja en `apps/backend/src/` (Módulos de Auth, Estaciones, Zonas, Clasificación, Usuarios).**
- **NO implementa código de contratos inteligentes en Solidity.**
- **NO almacena tokens de autenticación en `localStorage` o `sessionStorage` en el cliente.**

---

## 🚀 Módulos y Responsabilidades

### 1. Autenticación Segura (`src/auth/`)
- Implementar flujo de login/registro retornando tokens JWT a través de cabeceras `Set-Cookie` con banderas:
  - `httpOnly: true` (protección contra XSS).
  - `secure: process.env.NODE_ENV === 'production'` (transmisión sobre HTTPS).
  - `sameSite: 'lax'` o `'strict'` (mitigación de CSRF).
- Endpoints: `POST /api/v1/auth/login`, `POST /api/v1/auth/register`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`.

### 2. Gestión de Estaciones y Activación ESP32 (`src/estaciones/`)
- **CRUD de Estaciones**: Creación mediante formulario administrativo, asignación de zona y tipo de sensores.
- **Activación por Primer Ping**:
  - Endpoint `POST /api/v1/estaciones/activar` o `POST /api/v1/iot/ping`.
  - Vincular la dirección MAC del ESP32 con el token de aprovisionamiento emitido previamente.
  - Pasar el estado de la estación de `PENDING_ACTIVATION` a `ACTIVE` automáticamente sin intervención manual.

### 3. Zonas Fijas y Métricas (`src/zonas/`)
- Módulo de zonas geográficas/fijas para zonificación urbana y cálculo de calor de reciclaje.
- Relaciones en Prisma: `Zona` 1:N `Estacion`.

---

## 🔄 Flujo de Trabajo

1. **Modelado en Prisma**: Actualizar o validar `apps/backend/prisma/schema.prisma` y ejecutar `pnpm prisma generate` / `pnpm prisma migrate dev`.
2. **DTOs y Validación**: Crear DTOs con `class-validator` y `class-transformer` para validar tipos y sanear entradas.
3. **Controladores y Servicios**: Implementar lógica de negocio desacoplada con inyección de dependencias de NestJS.
4. **Documentación Swagger**: Decorar endpoints con `@ApiTags()`, `@ApiOperation()`, `@ApiResponse()` para mantener la documentación interactiva en `/api/docs`.
5. **Protección de Rutas**: Aplicar `JwtAuthGuard` y `RolesGuard` (`ADMIN`, `OPERATOR`, `USER`).
