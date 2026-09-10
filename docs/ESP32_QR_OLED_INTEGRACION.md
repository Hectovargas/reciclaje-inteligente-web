# Integración ESP32 + OLED SSD1306 + QR (CleanCity / Reciclaje Inteligente)

Documento de integración para conectar la **pantalla OLED SSD1306 0.96" (128x64, I2C)**
a un **ESP32** y que muestre el código QR generado por el backend, de forma que la
PWA móvil pueda escanearlo y reclamar puntos.

> Referencia del código: `firmware/qr-oled/`
> Referencia del backend: `apps/backend/src/qr/`, `apps/backend/src/clasificacion/`

---

## 1. Arquitectura y flujo

```
┌────────────────────┐  1. POST /api/v1/qr/generar (x-station-token)    ┌─────────────────────┐
│  ESP32 + OLED      │ ──────────────────────────────────────────────► │  Backend NestJS     │
│  (firmware)        │                                                  │  + PostgreSQL       │
│                    │ 2. { codigo: "QR-PLAS-...", firma: "0x...", ... }│  (genera QR firmado)│
│                    │ ◄────────────────────────────────────────────── │                     │
└────────┬───────────┘                                                  └─────────────────────┘
         │ 3. Renderiza el QR (solo el campo `codigo`) en el OLED
         ▼
┌────────────────────┐   4. Escanea con la PWA (/app) y reclama puntos
│  Celular (PWA)     │ ──► GET /api/v1/qr/verificar/:codigo
└────────────────────┘     POST /api/v1/qr/reclamar
```

**Regla crítica:** el QR debe contener **únicamente el campo `codigo`** (≈32–40
caracteres). El campo `qrPayload` (JSON con `c`, `m`, `p`, `exp`, `s`) supera los
120 caracteres y su versión QR no cabe legible en una pantalla de 64 px de alto.

---

## 2. Hardware y cableado

| Pixel | Periférico | GPIO ESP32 |
|-------|-----------|------------|
| OLED SDA | I2C data | **GPIO21** |
| OLED SCL | I2C clock | **GPIO22** |
| OLED VCC | Alimentación | **3.3V** |
| OLED GND | Tierra | **GND** |

- Dirección I2C del SSD1306 por defecto: **`0x3C`** (algunas placas usan `0x3D`).
- Resolución: 128x64. Asegúrate de comprar una variante 0.96" (128x64), no la de 1.3".
- Nivel lógico 3.3V: NO conectar VCC a 5V.

---

## 3. Requisitos de software

| Herramienta | Uso |
|-------------|-----|
| [PlatformIO Core](https://platformio.org/install) | Compilar y subir el firmware |
| **Docker + Docker Compose** | **Levantar todo el backend y servicios del repo** (`docker-compose.yml`) |
| (Opcional) [Wokwi](https://wokwi.com) | Simular ESP32 + SSD1306 sin hardware |

Dependencias del firmware (definidas en `platformio.ini`):

- `Adafruit SSD1306` + `Adafruit GFX Library`
- `ArduinoJson`
- `ricmoo/QRCode` (genera la matriz QR en C puro, licencia MIT)

---

## 4. Preparar el backend (provisionar la estación)

### 4.1 Vía recomendada: Docker Compose

El repositorio incluye `docker-compose.yml` con todos los servicios: **Postgres,
Vault, Redis y el backend NestJS**. Levantarlo es un solo comando:

```bash
docker compose up -d db vault redis backend
```

- El backend queda en `http://localhost:3000/api/v1` (publicado en `0.0.0.0`,
  así que el ESP32 lo alcanza con `http://<IP_LAN_PC>:3000/api/v1`).
- Al arrancar ejecuta automáticamente **migraciones Prisma + seed**, que crean:
  - Admin: `admin@recicla.com` / `admin123`.
  - Zona Prototipo + estación demo **`Estacion_prototipo_v1`** con token
    **`tk_prototipo_v1_recycle_ai_2026`** (el mismo que usa el firmware).
- El ID de la estación se ve en los logs:
  ```bash
  docker compose logs backend | grep -i "Station created"
  docker compose ps                       # estado de los servicios
  ```
- Swagger: `http://localhost:3000/api/docs`.
- La primera vez tarda un poco (instala deps en el contenedor). Los servicios
  quedan corriendo; para bajar todo: `docker compose down`.

### 4.2 Alternativa manual (sin Docker)

```bash
pnpm dev:backend          # requiere Postgres 15 corriendo y .env configurado
pnpm --filter backend exec ts-node seed-station.ts
```

Crea una zona y estación `ACTIVE` e imprime al final:

```
Token          : tk_prototipo_v1_recycle_ai_2026
ID de Estación : <UUID>
```

### 4.3 Flujo real (zero-touch provisioning)

El ESP32 envía su primer ping a `POST /api/v1/iot/activar` con
`{ macAddress, provisioningToken }`; el backend vincula la MAC, genera el
`device_secret` y marca la estación `ACTIVE`. El `x-station-token` de las
peticiones QR se obtiene de la estación ya activada.

---

## 5. Configurar el firmware

Editar `firmware/qr-oled/src/main.cpp`, bloque "CONFIGURACIÓN":

```cpp
const char* WIFI_SSID     = "TU_RED_WIFI";            // solo 2.4 GHz
const char* WIFI_PASS     = "TU_CONTRASENA";
const char* API_BASE      = "http://<IP_LAN_PC>:3000/api/v1";
const char* STATION_ID    = "<UUID_DE_LA_ESTACION>";  // opcional en /qr/generar
const char* STATION_TOKEN = "tk_prototipo_v1_recycle_ai_2026";
```

- `API_BASE`: apunta a la IP LAN del PC donde corre Docker
  (averíguala con `hostname -I`). El backend escucha en `0.0.0.0:3000`
  y el prefijo real es `/api/v1` (global prefix `api` + versionado `1`,
  ver `apps/backend/src/main.ts`).
- `STATION_TOKEN`: con Docker ya existe la estación demo seed-eada con este
  token. El guard `StationTokenGuard` valida solo el token, así que
  `STATION_ID` es opcional para `/qr/generar` (solo se usa en el body).
- `DEMO_PAYLOAD`: texto de respaldo si no hay red (por defecto `RCK-a1b2c3`).

---

## 6. Compilar y subir

```bash
cd firmware/qr-oled
pio run -t upload        # flashea vía USB
pio device monitor       # logs en serie @115200 baud
```

Logs esperados al arrancar:

```
[OLED] SSD1306 128x64 inicializado (SDA=21, SCL=22)
[WiFi] Conectado a <SSID> (IP: ...)
[HTTP] 201 bytes recibidos
[QR] payload=QR-PLASTICO-... | len=34 | v3 (29 mods) | escala=2 px
```

Si el escaneo con el móvil funciona sobre el PNG generado en la PC, funcionará
igual sobre el OLED (misma versión/escala).

---

## 7. Contrato HTTP usado por el firmware

**Endpoint:** `POST /api/v1/qr/generar`

**Headers:**

```
Content-Type: application/json
x-station-token: <token_de_la_estacion>
```

**Body (DTO `GenerarQrDto`):**

```json
{ "categoria": "Plástico", "stationId": "<UUID>", "peso": 0.3 }
```

**Respuesta 201 (ejemplo):**

```json
{
  "id": "6613f2c1-...",
  "codigo": "QR-PLASTICO-1728055911297-cd176f",
  "categoria": "Plástico",
  "material": "Plástico",
  "puntos": 10,
  "firma": "0x9a3f...",
  "usado": false,
  "timestamp": "2026-09-09T...",
  "expiresAt": "2026-09-09T...",
  "qrPayload": "{\"c\":\"QR-PLASTICO-1728055911297-cd176f\",\"m\":\"Plástico\",\"p\":10,\"exp\":...,\"s\":\"0x9a3f...\"}",
  "stationId": "<UUID>"
}
```

**En el firmware:** se lee `doc["codigo"]` → se genera el QR. NO se usa
`qrPayload` para renderizar.

**Alternativa integrada con clasificación:** `POST /api/v1/clasificacion`
(requiere `x-station-token`) devuelve el evento más `qr.codigo` anidado:
`doc["qr"]["codigo"]`. Es el flujo natural cuando la estación detecta un
residuo y debe pintar el QR de ese depósito. En `loop()` del firmware hay el
punto de enganche para que un sensor/botón dispare una nueva solicitud y
redibuje el QR.

---

## 8. Restricciones del payload para el OLED (128x64)

Versión máxima soportada por el firmware: **v3 (29 módulos)**. Capacidad en
**modo BYTE + ECC_LOW** (la librería usa BYTE cuando hay minúsculas/guiones):

| Versión | Módulos | Máx. bytes | Escala sugerida | Tamaño final |
|---------|---------|-----------|-----------------|--------------|
| v1      | 21x21   | 17        | 2–3 px          | 42–63 px |
| v2      | 25x25   | 32        | 2 px            | 50 px |
| v3      | 29x29   | 53        | 2 px            | 58 px |

- El firmware calcula la versión mínima automáticamente y la escala para que
  quepa en 64 px de alto con 1 módulo de zona de silencio.
- El formato actual del backend (`QR-CAT-<13dígitos>-<8hex>` ≈ 34 chars)
  cae en **v3 (29 módulos)** y se dibuja a escala 2 px (58 px) — cabe en 64 px.
- Si el payload supera 53 bytes, el firmware muestra `PAYLOAD DEMASIADO LARGO`
  en vez de un QR ilegible.

---

## 9. Modo demo (sin backend)

Con WiFi incorrecto o sin levantar el backend, el ESP32 pinta
`RCK-a1b2c3` (v1). Útil para validar OLED + escaneo:

```bash
pio run -t upload && pio device monitor
```

---

## 10. Pruebas sin hardware

1. **Lógica del render** — compilar el mismo código de ricmoo en el host:
   simula versión/escala y dibuja el QR en terminal/PBM.
2. **Pipeline completo** — pedir un `codigo` fresco al backend y generar un PNG
   escaneable con `qrcode` (npm); escanearlo con la PWA valida el flow completo.
3. **Simulación visual** — [Wokwi](https://wokwi.com) ESP32 + SSD1306 con el
   mismo `platformio.ini`.

---

## 11. Troubleshooting

| Síntoma | Causa probable | Solución |
|---------|----------------|----------|
| `SSD1306 no encontrado 0x3C` | Cableado I2C | Verifica SDA→21, SCL→22, VCC→3.3V; prueba `0x3D` |
| No conecta WiFi | Red 5 GHz o credenciales | ESP32 solo 2.4 GHz; revisa SSID/contraseña |
| `[HTTP] Error de red` | Backend inalcanzable | `docker compose up -d db vault redis backend` listo; `API_BASE` con IP LAN correcta; firewall |
| Backend no responde aún | Primera subida instala deps | Espera y revisa `docker compose ps` / `docker compose logs backend` |
| Código 401 | Token inválido / estación no existe | Verifica que el seed creó la estación (`logs`) y que el token es `tk_prototipo_v1_recycle_ai_2026` |
| `PAYLOAD DEMASIADO LARGO` | Se renderizó el JSON completo | Renderizar solo `doc["codigo"]` |
| QR no lo escanea el móvil | Contraste / tamaño | Limpia el OLED; escala 2px + zona de silencio; acerca el celular |
| `Código no encontrado` al verificar | QR expirado (10 min TTL) | Generar un QR nuevo antes de escanear |

---

## 12. Checklist de puesta en marcha con hardware real

1. [ ] Cablear OLED: SDA→21, SCL→22, VCC→3.3V, GND→GND.
2. [ ] Levantar backend con Docker: `docker compose up -d`.
3. [ ] Confirmar que el seed creó la estación demo (token `tk_prototipo_v1_recycle_ai_2026`) en `docker compose logs` o `curl http://localhost:3000/api/docs`.
4. [ ] Configurar `WIFI_SSID`, `WIFI_PASS`, `API_BASE`, `STATION_TOKEN`.
5. [ ] `pio run -t upload`.
6. [ ] Validar en `pio device monitor` el log `[QR] payload=... vN ... escala=2 px`.
7. [ ] Escanear el OLED con la PWA (`/app`).
8. [ ] Verificar en el dashboard que el QR fue reclamado (puntos en balance).