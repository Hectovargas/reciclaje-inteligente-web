---
name: pwa-engineer
description: >-
  Implementa y optimiza la Progressive Web App (PWA) móvil para usuarios en apps/pwa.
  Utilizar para configurar service workers, manifest.json, soporte offline básico,
  y el flujo completo de escaneo de QR, autenticación y reclamo de puntos de reciclaje.
---

# PWA Engineer Skill

Esta habilidad guía la construcción, configuración y optimización de la **Progressive Web App (PWA)** en `apps/pwa` para el ecosistema **CleanCity / Reciclaje Inteligente Web**.

---

## 🎯 Objetivo y Alcance

Desarrollar una aplicación web progresiva móvil orientada a la experiencia de usuario, permitiendo el escaneo fluido de códigos QR generados por las estaciones de reciclaje, gestión de sesión y reclamo de tokens de recompensa.

### ⛔ Límites Estrictos
- **Trabaja en `apps/pwa` (Next.js, React, TypeScript, TailwindCSS/CSS, Web3 Wallet SDK).**
- **NO modifica endpoints del backend ni lógica interna del IoT.**
- **NO guarda credenciales sensibles ni llaves privadas en `localStorage` o `sessionStorage`.**

---

## 📱 Capacidades PWA y Características Clave

1. **Configuración PWA**:
   - `manifest.json` completo: nombre de la app, iconos adaptables (192x192, 512x512, maskable), tema (`theme_color`), orientación `portrait`.
   - **Service Worker**: Cacheo de assets estáticos, páginas críticas para visualización offline básica y gestión de actualizaciones de la app (*prompt to update*).
2. **Flujo Central de Reclamo (*QR Claim Flow*)**:
   - **Paso 1 - Escaneo**: Acceso a la cámara mediante navegador y decodificación de código QR en tiempo real (`html5-qrcode` / `@zxing/library`).
   - **Paso 2 - Verificación de Sesión**: Si el usuario no está autenticado, guardar temporalmente el token del QR en memoria/parámetro de redirección y redirigir al login/registro simplificado.
   - **Paso 3 - Validación del Reclamo**: Enviar el token QR a `GET/POST /api/v1/qr/verificar` o `POST /api/v1/recompensas/reclamar`.
   - **Paso 4 - Confirmación Visual**: Animación de éxito mostrando los puntos/tokens `RECI` acreditados y el balance actualizado.

---

## 🔄 Flujo de Trabajo

1. **Configuración del Entorno PWA**: Configurar `@ducanh2912/next-pwa` o `next-pwa` en `next.config.js`.
2. **Componente de Escáner QR**: Implementar lector de cámara con permisos interactivos, selector de cámara trasera/frontal y manejo de errores de iluminación o enfoque.
3. **Gestión de Autenticación**: Manejar cookies `httpOnly` transparentes mediante el backend para preservar sesiones seguras.
4. **Manejo Offline**: Mostrar pantalla amigable de "Sin conexión" con opciones de reconexión cuando se pierda el acceso a internet.
5. **Auditoría Lighthouse**: Validar que la aplicación cumpla con las métricas de PWA (Instalable, Accesible, Buenas Prácticas > 90).
