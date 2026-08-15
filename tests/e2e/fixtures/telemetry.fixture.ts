/**
 * IoT Ultrasonic Telemetry Fixtures for CleanCity E2E Tests
 */

export interface TelemetryCompartments {
  papel: number;    // Fill percentage (0-100)
  plastico: number; // Fill percentage (0-100)
  metal: number;    // Fill percentage (0-100)
}

export interface TelemetryPayload {
  macAddress: string;
  token: string;
  levels: TelemetryCompartments;
  battery: number; // Percentage (0-100)
  temperatureCelsius?: number;
  timestamp?: string;
}

export function createNormalTelemetryPayload(macAddress: string, token: string): TelemetryPayload {
  return {
    macAddress,
    token,
    levels: {
      papel: 35,
      plastico: 42,
      metal: 20,
    },
    battery: 95,
    temperatureCelsius: 23.5,
    timestamp: new Date().toISOString(),
  };
}

export function createWarningTelemetryPayload(
  macAddress: string,
  token: string,
  overfilledCategory: keyof TelemetryCompartments = 'plastico'
): TelemetryPayload {
  const levels: TelemetryCompartments = {
    papel: 40,
    plastico: 50,
    metal: 30,
  };
  levels[overfilledCategory] = 85; // >= 80% threshold triggers WARNING

  return {
    macAddress,
    token,
    levels,
    battery: 88,
    temperatureCelsius: 25.1,
    timestamp: new Date().toISOString(),
  };
}

export function createOverflowTelemetryPayload(macAddress: string, token: string): TelemetryPayload {
  return {
    macAddress,
    token,
    levels: {
      papel: 110,   // Overflow > 100%
      plastico: 125, // Overflow > 100%
      metal: 95,
    },
    battery: 80,
    temperatureCelsius: 28.0,
    timestamp: new Date().toISOString(),
  };
}

export function createNegativeTelemetryPayload(macAddress: string, token: string): TelemetryPayload {
  return {
    macAddress,
    token,
    levels: {
      papel: -15, // Faulty ultrasonic sensor value
      plastico: 30,
      metal: -5,
    },
    battery: -10,
    timestamp: new Date().toISOString(),
  };
}

export function createCriticalBatteryTelemetryPayload(macAddress: string, token: string): TelemetryPayload {
  return {
    macAddress,
    token,
    levels: {
      papel: 20,
      plastico: 25,
      metal: 15,
    },
    battery: 5, // <= 10% critical battery warning
    timestamp: new Date().toISOString(),
  };
}
