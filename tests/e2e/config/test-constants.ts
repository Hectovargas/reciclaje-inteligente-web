/**
 * CleanCity Test Constants
 * Key pairs, addresses, deterministic UUIDs, and seed data for opaque-box testing.
 */

export const TEST_CONSTANTS = {
  // Deterministic Admin Private Key for local cryptographic signing (matches fallback/vault mock)
  ADMIN_PRIVATE_KEY: '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  // Derived Admin Public Address
  ADMIN_ADDRESS: '0xFCAd0B19bB29D4674531d6f115237E16AfCE377c',

  // Mock User Keys & Addresses
  USER_ALICE: {
    email: 'alice.recycler@test.cleancity.io',
    password: 'Password123!Secure',
    name: 'Alice Recycler',
    role: 'USER',
    privateKey: '0x1111111111111111111111111111111111111111111111111111111111111111',
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  },
  USER_BOB: {
    email: 'bob.eco@test.cleancity.io',
    password: 'Password123!Secure',
    name: 'Bob Eco',
    role: 'USER',
    privateKey: '0x2222222222222222222222222222222222222222222222222222222222222222',
    address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
  },
  ADMIN_USER: {
    email: 'admin@recicla.com',
    password: 'admin123',
    name: 'CleanCity System Admin',
    role: 'ADMIN',
    address: '0xFCAd0B19bB29D4674531d6f115237E16AfCE377c',
  },
  MANAGER_USER: {
    email: 'manager@recicla.com',
    password: 'manager123',
    name: 'Zone Operations Manager',
    role: 'MANAGER',
    address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
  },

  // Test Zones
  ZONES: {
    DOWNTOWN: {
      id: 'zone-uuid-downtown-01',
      name: 'Zona Centro Urbano',
      isActive: true,
    },
    NORTH_PARK: {
      id: 'zone-uuid-northpark-02',
      name: 'Zona Parque Norte',
      isActive: true,
    },
    INDUSTRIAL: {
      id: 'zone-uuid-industrial-03',
      name: 'Zona Industrial Sur',
      isActive: false,
    },
  },

  // Test ESP32 Stations
  STATIONS: {
    STATION_01: {
      id: 'station-uuid-001',
      name: 'Estación Inteligente Plaza Mayor',
      location: 'Plaza Mayor, Sector A',
      macAddress: 'AA:BB:CC:11:22:33',
      provisioningToken: 'PROV-TOK-STATION-01-SECURE-9988',
      capacity: 100,
      zoneId: 'zone-uuid-downtown-01',
      status: 'ACTIVE',
    },
    STATION_PENDING: {
      id: 'station-uuid-002',
      name: 'Estación Parque Central (Nueva)',
      location: 'Parque Central, Kiosco B',
      macAddress: 'DD:EE:FF:44:55:66',
      provisioningToken: 'PROV-TOK-STATION-02-NEW-7766',
      capacity: 100,
      zoneId: 'zone-uuid-northpark-02',
      status: 'PENDING_ACTIVATION',
    },
  },

  // Material reward rates (points per unit)
  POINTS_PER_CATEGORY: {
    'Plástico': 10,
    'Papel': 5,
    'Metal': 15,
    'Vidrio': 8,
  },
};
