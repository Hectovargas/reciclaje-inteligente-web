# ESP32 + OLED SSD1306 — Render de QR en pantalla

> Guía completa de integración (cableado, provisionado de estación, contrato HTTP
> y troubleshooting): [`docs/ESP32_QR_OLED_INTEGRACION.md`](../../docs/ESP32_QR_OLED_INTEGRACION.md)

Firmware en C++ (Arduino/PlatformIO) que genera y dibuja en tiempo real un
código QR sobre un **OLED SSD1306 0.96" (128x64, I2C)** conectado a un **ESP32**,
usando la librería [ricmoo/QRCode](https://github.com/ricmoo/QRCode) para generar
la matriz y **Adafruit_SSD1306 + Adafruit_GFX** para dibujarla.

## Conexión (hardware)

| Pin OLED | Pin ESP32 |
|----------|-----------|
| SDA      | GPIO21    |
| SCL      | GPIO22    |
| VCC      | 3.3V      |
| GND      | GND       |

Dirección I2C por defecto del SSD1306: `0x3C`.

## Compilar y subir

```bash
# Requiere PlatformIO Core (https://platformio.org)
cd firmware/qr-oled
pio run -t upload        # compila y flashea vía USB
pio device monitor       # logs en serie a 115200 baud
```

Las dependencias se resuelven por `lib_deps` en `platformio.ini`
(Adafruit GFX, Adafruit SSD1306, ArduinoJson y ricmoo/QRCode vía git).

## Cómo funciona

1. `setup()` inicializa I2C en GPIO21/GPIO22 y el display SSD1306.
2. Conecta a WiFi y pide un QR fresco al backend:
   `POST {API_BASE}/qr/generar` con la cabecera `x-station-token`.
3. Extrae el campo `codigo` de la respuesta JSON (payload corto).
4. `drawQrFromText()`:
   - Calcula la **versión mínima** necesaria del QR (máx. versión 3 por caber en 64 px).
   - Genera la matriz con `qrcode_initText()` y nivel de corrección **LOW**.
   - Calcula la **escala** automáticamente (2-3 px/módulo) para que el QR quepa
     centrado en 128x64 con zona de silencio de 1 módulo.
   - Dibuja módulo por módulo con `fillRect()` y hace `display()`.

Si no hay red, se muestra el payload de demostración `RCK-a1b2c3`.

## Restricción clave: payload corto

La pantalla es de 128x64 px. El firmware limita la versión del QR a **v3
(29 módulos)**, que a escala 2px ocupa ~58px y queda legible ante la cámara.
La capacidad de versión en **modo BYTE + ECC_LOW** es:

| Versión | Módulos | Máx. bytes |
|---------|---------|-----------|
| 1       | 21x21   | 17        |
| 2       | 25x25   | 32        |
| 3       | 29x29   | 53        |

**Recomendación para el backend:** que el contenido renderizado sea únicamente
el `codigo` (`QR-CAT-<timestamp>-<hex>` ≈ 34 caracteres), **nunca** el JSON
completo con firma, porque éste supera los 128 caracteres y su versión
requerida no cabe legible en el OLED.

Con ese `codigo` el PWA verifica contra `GET /api/v1/qr/verificar/:codigo` y
reclama puntos con `POST /api/v1/qr/reclamar` sin necesidad de incluir la firma,
tal como define el flujo del proyecto (ver `docs/DOCUMENTO_SISTEMA_COMPLETO.md`).