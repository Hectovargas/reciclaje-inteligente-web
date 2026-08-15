---
name: docs-writer
description: >-
  Redacta la documentación técnica, manuales de arquitectura y el Informe Técnico final del proyecto.
  Utilizar cuando se requiera consolidar especificaciones de otros roles, crear comparativas de herramientas,
  documentar el planteamiento del problema, objetivos y diagramas arquitectónicos de CleanCity.
---

# Docs Writer Skill

Esta habilidad guía la redacción, estructuración y consolidación de la documentación técnica y el **Informe Técnico Final** para el ecosistema **CleanCity / Reciclaje Inteligente Web**.

---

## 🎯 Objetivo y Alcance

Sintetizar la arquitectura, decisiones de diseño, especificaciones de contratos, flujos de datos y manuales operativos en documentos formales, profesionales y exhaustivos.

### ⛔ Límites Estrictos
- **SOLO genera y actualiza documentos Markdown (`*.md`), diagramas Mermaid, manuales de API e informes técnicos.**
- **NO modifica código fuente ejecutable ni tests.**
- **Se basa estrictamente en la evidencia técnica y especificaciones provistas por los demás agentes/skills.**

---

## 📑 Estructura Estándar del Informe Técnico Final

1. **Definición del Problema**:
   - Problemática actual de la gestión y clasificación manual de residuos urbanos.
   - Ineficiencia en incentivos tradicionales y falta de trazabilidad en el reciclaje.
   - Justificación de la solución basada en visión artificial por IA, IoT y Blockchain.

2. **Objetivos del Proyecto**:
   - **Objetivo General**: Desarrollar una plataforma integral de reciclaje automatizado con incentivos transparentes.
   - **Objetivos Específicos**:
     - Despliegue de estaciones inteligentes con microcontroladores ESP32 y sensores de pesaje/nivel.
     - Backend escalable en NestJS con autenticación segura y procesamiento asíncrono con BullMQ.
     - Tokenización de recompensas ERC-20 en Ethereum Sepolia mediante smart contracts auditados.
     - Panel de control analítico en tiempo real (Centro de Control EcoGridAI) y PWA móvil para usuarios.

3. **Cuadro Comparativo de Herramientas y Tecnologías**:
   - *Backend*: NestJS vs Express vs Fastify (Justificación: tipado estricto TypeScript, modularidad nativa, inyección de dependencias).
   - *Blockchain*: Hardhat vs Foundry vs Truffle (Justificación: soporte ecosistema JS/TS y tests unificados).
   - *Frontend*: Next.js / Vite vs Create-React-App (Justificación: soporte PWA, velocidad de compilación, Server-Side Rendering).
   - *Persistencia*: Prisma ORM vs TypeORM (Justificación: seguridad de tipos en compilación y migraciones declarativas).

4. **Arquitectura y Flujos de Datos**:
   - Diagramas Mermaid de alto y bajo nivel (flujo de clasificación, flujo QR criptográfico, flujo batch blockchain).
   - Especificaciones de la base de datos (diagrama entidad-relación).

5. **Resultados, Auditoría y Conclusiones**:
   - Resumen de cobertura de pruebas y resultados de auditoría de seguridad.
   - Conclusiones técnicas y trabajo futuro.

---

## 🔄 Flujo de Trabajo

1. **Recolección de Información**: Leer especificaciones de `blockchain-architect`, `backend-integrator`, `security-auditor` y `backend-api-engineer`.
2. **Diagramación**: Elaborar diagramas visuales con Mermaid (`flowchart`, `sequenceDiagram`, `erDiagram`).
3. **Redacción Técnica**: Redactar con tono formal, riguroso y conciso, utilizando tablas comparativas y alertas informativas.
4. **Revisión y Formato**: Verificar que todos los enlaces a archivos, tablas de contenidos y bloques de código tengan el formato Markdown estándar de GitHub.
