#include <Arduino.h>
#include <Wire.h>

#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

#include "qrcode.h"

// ---------------------------------------------------------------------------
//  CONFIGURACIÓN
//  Cambia estos valores según tu estación.
// ---------------------------------------------------------------------------
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define OLED_ADDR 0x3C

// OLED por I2C: SDA -> GPIO21, SCL -> GPIO22 (pines por defecto del ESP32)
#define I2C_SDA 21
#define I2C_SCL 22

// Nivel de corrección de error BAJO para maximizar capacidad en pantalla chica
#define QR_ECC ECC_LOW

// Módulos extra de "zona de silencio" alrededor del QR (mejora el escaneo)
#define QUIET_ZONE_MODULES 1

// Límite de versión legible en 128x64 (v3 = 29 módulos => escala 2-3 px)
#define MAX_READABLE_VERSION 3
#define QR_BUFFER_SIZE(ver) ((((ver) * 4 + 17) * ((ver) * 4 + 17) + 7) / 8)

// Red WiFi y backend (ajusta a tu entorno)
const char* WIFI_SSID = "TU_RED_WIFI";
const char* WIFI_PASS = "TU_CONTRASENA";
const char* API_BASE = "http://192.168.1.100:3000/api/v1";
const char* STATION_ID = "TU_ESTACION_UUID";
const char* STATION_TOKEN = "TOKEN_DE_ESTACION";

// Payload de demostración (para probar el render sin backend)
const char* DEMO_PAYLOAD = "RCK-a1b2c3";

// ---------------------------------------------------------------------------

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

static uint8_t qrBuffer[QR_BUFFER_SIZE(MAX_READABLE_VERSION)];
static QRCode qr;

/**
 * Devuelve la versión mínima de QR (1..MAX_READABLE_VERSION) capaz de alojar
 * `len` bytes en modo BYTE con corrección de error LOW.
 * Capacidades (BYTE): v1=17, v2=32, v3=53.
 */
static uint8_t requiredVersion(size_t len) {
  static const uint8_t byteCapLow[3] = {17, 32, 53};
  for (uint8_t v = 1; v <= MAX_READABLE_VERSION; v++) {
    if (len <= byteCapLow[v - 1]) {
      return v;
    }
  }
  return 0;  // payload demasiado largo para la pantalla
}

/**
 * Renderiza `payload` como QR centrado en el OLED 128x64.
 * Calcula la escala automáticamente (2-3 px/módulo) para que quepa en 64px
 * de alto manteniendo la zona de silencio.
 */
static bool drawQrFromText(const char* payload) {
  if (!payload || !*payload) {
    return false;
  }

  const size_t len = strlen(payload);
  const uint8_t version = requiredVersion(len);
  if (version == 0) {
    return false;
  }

  if (qrcode_initText(&qr, qrBuffer, version, QR_ECC, payload) != 0) {
    return false;
  }

  const uint8_t modules = qr.size;
  const uint8_t cells = modules + (2 * QUIET_ZONE_MODULES);
  const uint8_t scale =
      (uint8_t)min(SCREEN_WIDTH / cells, SCREEN_HEIGHT / cells);
  if (scale == 0) {
    return false;
  }

  const int16_t px = (SCREEN_WIDTH - modules * scale) / 2;
  const int16_t py = (SCREEN_HEIGHT - modules * scale) / 2;

  display.clearDisplay();
  for (uint8_t y = 0; y < modules; y++) {
    for (uint8_t x = 0; x < modules; x++) {
      if (qrcode_getModule(&qr, x, y)) {
        display.fillRect(px + x * scale, py + y * scale, scale, scale,
                         SSD1306_WHITE);
      }
    }
  }
  display.display();

  Serial.printf("[QR] payload=%s | len=%u | v%u (%u mods) | escala=%u px\n",
                payload, (unsigned)len, version, modules, scale);
  return true;
}

static void showMessage(const char* msg) {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 28);
  display.print(msg);
  display.display();
  Serial.println(msg);
}

static bool connectWiFi() {
  showMessage("Conectando WiFi...");
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  for (int i = 0; i < 30 && WiFi.status() != WL_CONNECTED; i++) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WiFi] No se pudo conectar. Usando payload demo.");
    return false;
  }
  Serial.printf("[WiFi] Conectado a %s (IP: %s)\n", WIFI_SSID,
                WiFi.localIP().toString().c_str());
  return true;
}

/**
 * Solicita un QR fresco al backend: POST /api/v1/qr/generar
 * Cabecera de autenticación de estación: x-station-token.
 * Retorna el campo `codigo` (payload corto para el OLED).
 */
static String fetchCodigo() {
  HTTPClient http;
  http.begin(String(API_BASE) + "/qr/generar");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-station-token", STATION_TOKEN);

  String body = String("{\"categoria\":\"Plástico\",\"stationId\":\"") +
                STATION_ID + "\",\"peso\":0.3}";

  const int httpCode = http.POST(body);
  if (httpCode <= 0) {
    Serial.printf("[HTTP] Error de red: %s\n", http.errorToString(httpCode).c_str());
    http.end();
    return "";
  }

  Serial.printf("[HTTP] %d bytes recibidos\n", httpCode);
  const String response = http.getString();
  http.end();

  if (httpCode != HTTP_CODE_CREATED && httpCode != HTTP_CODE_OK) {
    Serial.printf("[HTTP] Código inesperado: %d -> %s\n", httpCode,
                  response.c_str());
    return "";
  }

  JsonDocument doc;
  if (deserializeJson(doc, response)) {
    Serial.println("[JSON] Respuesta no parseable");
    return "";
  }

  const char* codigo = doc["codigo"];
  return codigo ? String(codigo) : "";
}

void setup() {
  Serial.begin(115200);

  Wire.begin(I2C_SDA, I2C_SCL);
  if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR)) {
    Serial.println("[OLED] SSD1306 no encontrado en la dirección I2C 0x3C");
    for (;;) {
      delay(1000);
    }
  }
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  Serial.println("[OLED] SSD1306 128x64 inicializado (SDA=21, SCL=22)");

  // Red opcional: si falla, se muestra el payload de demostración.
  const bool online = connectWiFi();

  String payload = online ? fetchCodigo() : "";
  if (payload.length() == 0) {
    payload = DEMO_PAYLOAD;
  }

  if (!drawQrFromText(payload.c_str())) {
    showMessage("PAYLOAD DEMASIADO LARGO");
  }
}

void loop() {
  // Mantener vivo el QR en pantalla. Aquí puede agregarse la lectura de un
  // botón/sensor que dispare drawQrFromText() con un nuevo codigo.
  delay(1000);
}