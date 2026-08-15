/**
 * Station & Zone Fixtures for CleanCity E2E Tests
 */

export interface CreateZoneDto {
  name: string;
  isActive?: boolean;
}

export interface CreateStationDto {
  name: string;
  location: string;
  zoneId: string;
  macAddress?: string;
  capacity?: number;
  status?: string;
}

export interface ActivateStationDto {
  macAddress: string;
  provisioningToken: string;
}

export function createValidZonePayload(overrides?: Partial<CreateZoneDto>): CreateZoneDto {
  const timestamp = Date.now();
  return {
    name: `Zona Metropolitana Sector ${timestamp}`,
    isActive: true,
    ...overrides,
  };
}

export function createValidStationPayload(zoneId: string, overrides?: Partial<CreateStationDto>): CreateStationDto {
  const rand = Math.floor(Math.random() * 89999 + 10000);
  const hexMac = `${rand.toString(16).padStart(4, '0').toUpperCase().match(/.{1,2}/g)?.join(':') || '11:22'}`;
  return {
    name: `Estación EcoSmart ${rand}`,
    location: `Avenida Central #${rand}, Sector Norte`,
    zoneId,
    macAddress: `AA:BB:CC:${hexMac}:99`,
    capacity: 100,
    ...overrides,
  };
}

export function createValidActivationPayload(macAddress: string, provisioningToken: string): ActivateStationDto {
  return {
    macAddress,
    provisioningToken,
  };
}
