---
name: security-auditor
description: >-
  Audita la seguridad integral del sistema antes de demos públicas o despliegues a producción.
  Utilizar para inspeccionar llaves privadas, cifrado de secretos en BD, control de acceso
  en smart contracts, unicidad de tx_hash en blockchain_events y sanitización de variables de entorno.
---

# Security Auditor Skill

Esta habilidad guía la auditoría de seguridad preventiva y técnica en todo el monorepo **CleanCity / Reciclaje Inteligente Web**.

---

## 🎯 Objetivo y Alcance

Identificar vulnerabilidades de seguridad, fugas de secretos, fallos de control de acceso criptográfico e inconsistencias de integridad de datos antes de exposiciones o demostraciones públicas.

### ⛔ Límites Estrictos
- **SOLO audita, analiza código, inspecciona configuraciones y emite reportes detallados.**
- **NO modifica código fuente ni altera configuraciones de producción.**
- **NO corrige las vulnerabilidades detectadas directamente (el equipo responsable debe subsanarlas).**

---

## 🔍 Puntos Críticos de Auditoría

### 1. Gestión de Secretos y Variables de Entorno
- [ ] Verificar que `ADMIN_PRIVATE_KEY`, `JWT_SECRET`, `VAULT_TOKEN` o credenciales de bases de datos **NO** estén hardcodeadas ni incluidas en archivos `.env` versionados en Git (`.gitignore`).
- [ ] Confirmar que las variables de entorno de producción se gestionen mediante HashiCorp Vault o inyección segura en CI/CD.

### 2. Seguridad en Smart Contracts (`packages/contracts`)
- [ ] Comprobar que las funciones críticas (`mint`, `mintBatch`, `pause`, `unpause`) tengan modificadores estrictos de control de acceso (`onlyRole(MINTER_ROLE)` / `onlyOwner`).
- [ ] Verificar protección contra desbordamientos, reentrancy y arrays desbalanceados en operaciones por lote.
- [ ] Asegurar que el contrato no permita autodestrucción no autorizada ni cambios arbitrarios de administrador.

### 3. Cifrado de Wallets Custodiales en Base de Datos
- [ ] Confirmar que las llaves privadas de usuarios se almacenen con cifrado robusto autenticado (e.g. AES-256-GCM con IV único por registro) y **NUNCA** en texto claro en PostgreSQL.
- [ ] Validar que la llave maestra de cifrado no se registre en logs ni respuestas HTTP.

### 4. Integridad Blockchain e Idempotencia
- [ ] Verificar que la tabla `blockchain_events` cuente con restricciones de unicidad (`UNIQUE`) sobre `tx_hash` o identificadores de reclamo para evitar ataques de doble gasto (*double spending*) o reprocesamiento accidental.
- [ ] Comprobar que los tokens QR cuenten con firma elíptica/HMAC con tiempo de expiración corto (TTL) y protección contra reuso (*nonce* consumido).

---

## 📄 Estructura del Reporte de Auditoría

El auditor debe estructurar sus hallazgos en el siguiente formato:

1. **Resumen Ejecutivo**: Nivel de riesgo global (`CRÍTICO`, `ALTO`, `MEDIO`, `BAJO`, `INFORMATIVO`).
2. **Matriz de Vulnerabilidades**:
   | ID | Severidad | Componente | Descripción | Impacto |
   |---|---|---|---|---|
   | SEC-01 | Alta | `apps/backend/src/...` | Descripción breve | Impacto potencial |
3. **Detalle de Hallazgos y Recomendaciones**: Explicación técnica de la vulnerabilidad y pasos exactos que el ingeniero correspondiente debe aplicar para mitigarla.
