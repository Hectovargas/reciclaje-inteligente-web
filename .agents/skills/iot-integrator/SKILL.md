---
name: iot-integrator
description: >-
  Implementa la lógica del lado del servidor para comunicación con microcontroladores ESP32 y sensores IoT.
  Utilizar para manejar pings de activación por MAC y token, recepción de telemetría de llenado,
  y generación del payload criptográfico para códigos QR mostrados en pantallas OLED.
---

# IoT Integrator Skill

Esta habilidad guía el desarrollo de los servicios y protocolos de comunicación del lado del servidor con los microcontroladores **ESP32** y sensores de las estaciones en **CleanCity / Reciclaje Inteligente Web**.

---

## 🎯 Objetivo y Alcance

Garantizar una comunicación bidireccional segura, eficiente y resiliente entre el backend NestJS y el hardware embebido ESP32 (cámaras, sensores de nivel ultrasónicos, pantallas OLED).

### ⛔ Límites Estrictos
- **Implementa la lógica del lado servidor en `apps/backend` (Módulos IoT, QR, Telemetría, WebSockets/MQTT/HTTP).**
- **NO programa firmware C++/Arduino directamente salvo generación de especificaciones de payload.**
- **NO expone endpoints IoT sin validación criptográfica o tokens de dispositivo.**

---

## 📡 Protocolos y Flujos de Comunicación

### 1. Activación Automática por Primer Ping (Zero-Touch Provisioning)
- **Flujo**:
  1. El ESP32 arranca de fábrica con un `provisioning_token` temporal grabado o escaneado.
  2. En su primera conexión a internet, el ESP32 envía un POST con `{ mac_address: "XX:XX:XX:XX:XX:XX", token: "PROV_XYZ" }`.
  3. El servidor busca la estación pendiente asociada al token, vincula de forma definitiva la `mac_address`, genera un `device_secret` permanente y marca la estación como `ACTIVE`.
  4. La estación queda habilitada para operar inmediatamente sin aprobación manual del administrador.

### 2. Generación y Envío del Payload QR para OLED
- Cuando la estación detecta y clasifica un residuo exitosamente:
  1. El backend recibe el evento de clasificación con el peso/tipo de material.
  2. Genera un token QR firmado con firma elíptica (secp256k1 / HMAC-SHA256) con un TTL corto (ej. 120 segundos).
  3. Estructura el payload optimizado para renderizado en pantalla OLED (formato string compacto o matriz de bits QR).
  4. Retorna el payload al ESP32 para su proyección en la pantalla OLED de la estación física.

### 3. Recepción de Telemetría y Alertas de Llenado
- Endpoint de telemetría periódica (`POST /api/v1/iot/telemetria`):
  - Nivel de llenado por compartimento (porcentaje o distancia en cm).
  - Estado de batería / alimentación.
  - Alertas de anomalías (tapa atascada, sensor desconectado).

---

## 🔄 Flujo de Trabajo

1. **Definición de DTOs IoT**: Especificar estructuras de datos compactas y eficientes para optimizar ancho de banda en microcontroladores.
2. **Seguridad de Comunicación**: Validar firmas de cabecera (`X-Device-Signature`) o HMAC utilizando el `device_secret`.
3. **Manejo de Desconexiones**: Implementar lógica de detección de estaciones fuera de línea si no se reciben *heartbeats* en una ventana de tiempo configurable.
4. **Validación de Payloads QR**: Asegurar que los datos transmitidos sean rápidamente parseables por la librería QR del ESP32.
