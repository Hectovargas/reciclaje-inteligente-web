# 📚 Centro de Documentación Técnica de CleanCity

Este directorio centraliza toda la documentación técnica, especificaciones arquitectónicas, manuales de contexto y reportes de auditoría y pruebas del proyecto **CleanCity / Reciclaje Inteligente Web**.

---

## 📑 Índice de Documentos

| Documento | Descripción | Audiencia / Rol |
| :--- | :--- | :--- |
| 📘 **[`INFORME_TECNICO.md`](./INFORME_TECNICO.md)** | **Informe Técnico Final** formal (11 capítulos): justificación del problema, matrices comparativas, diagramas Mermaid, catálogo OpenAPI, contratos Solidity, auditoría de seguridad y guía de demo. | Arquitectos, Evaluadores, Líderes Técnicos |
| 🌐 **[`GENERAL_CONTEXT.md`](./GENERAL_CONTEXT.md)** | Visión panorámica del monorepo, topología de servicios, mapeo de puertos y variables de entorno globales. | Desarrolladores Monorepo, DevOps |
| ⚙️ **[`BACKEND_CONTEXT.md`](./BACKEND_CONTEXT.md)** | Arquitectura de la API NestJS, Prisma ORM, flujos Web3 con BullMQ, gestión de wallets custodiales y endpoints REST. | Backend Engineers, Integradores Web3 |
| 📱 **[`FRONTEND_CONTEXT.md`](./FRONTEND_CONTEXT.md)** | Arquitectura y componentes del Dashboard de Control (React 18/Vite) y la PWA Móvil (Next.js 14). | Frontend Engineers, UI/UX |
| 🛡️ **[`SECURITY_AUDIT.md`](./SECURITY_AUDIT.md)** | Reporte formal de auditoría de seguridad, mitigación de replay attacks en QR, control de acceso RBAC y custodia segura de claves con AES-256-GCM / HashiCorp Vault. | Auditores de Seguridad, SecOps |
| 🧪 **[`TEST_INFRA.md`](./TEST_INFRA.md)** | Metodología de pruebas de 4 capas (*Opaque-Box E2E* y suites unitarias/integración con más de 269 casos de prueba). | QA Engineers, Testers |
| ✅ **[`TEST_READY.md`](./TEST_READY.md)** | Guía de preparación y certificación del entorno de pruebas y checklist de ejecución automatizada. | QA / CI/CD |

---

## 🏗️ Mapa de Navegación Rápida

- **¿Quieres levantar el proyecto completo?** Revisa el [README.md principal](../README.md#iniciar-con-docker-compose).
- **¿Buscas los contratos inteligentes?** Consulta [INFORME_TECNICO.md (Capítulo 7)](./INFORME_TECNICO.md#7-módulo-blockchain-y-smart-contracts-erc-20) y el directorio [`packages/contracts/`](../packages/contracts/).
- **¿Deseas probar la API REST?** Accede a la documentación interactiva Swagger en `http://localhost:3000/api/docs`.
