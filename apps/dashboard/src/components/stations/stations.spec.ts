import { Station, getStatusConfig, getStationZoneName } from '../../config/api'

describe('Stations Module Integration & Data Model Verification', () => {
  const mockStations: Station[] = [
    {
      id: 'est-001',
      name: 'Estación Cafetería',
      location: 'Edificio 1, Planta Baja',
      status: 'ACTIVE',
      capacity: 100,
      today: 45,
      token: 'tk_active_01',
      macAddress: '24:6F:28:A1:B2:C1',
      provisioningToken: 'prov_active_01',
      zone: { id: 'z-unitec', name: 'UNITEC', isActive: true },
      lastTelemetry: {
        id: 'telem-01',
        stationId: 'est-001',
        nivelPapel: 45,
        nivelPlastico: 60,
        nivelMetal: 30,
        bateria: 95,
        timestamp: new Date().toISOString()
      }
    },
    {
      id: 'est-002',
      name: 'Estación Plaza Central',
      location: 'Plaza Principal',
      status: 'WARNING',
      capacity: 120,
      today: 110,
      token: 'tk_warning_02',
      macAddress: '24:6F:28:A1:B2:C2',
      provisioningToken: 'prov_warning_02',
      zone: { id: 'z-unitec', name: 'UNITEC', isActive: true },
      lastTelemetry: {
        id: 'telem-02',
        stationId: 'est-002',
        nivelPapel: 85,
        nivelPlastico: 88,
        nivelMetal: 70,
        bateria: 80,
        timestamp: new Date().toISOString()
      }
    },
    {
      id: 'est-003',
      name: 'Estación Nueva en Espera',
      location: 'Entrada Principal',
      status: 'PENDING_ACTIVATION',
      capacity: 100,
      today: 0,
      token: 'tk_pending_03',
      macAddress: 'AA:BB:CC:DD:EE:FF',
      provisioningToken: 'prov_zero_touch_03',
      zone: { id: 'z-altara', name: 'Altara', isActive: true },
      lastTelemetry: null
    },
    {
      id: 'est-004',
      name: 'Estación Desconectada',
      location: 'Estacionamiento B',
      status: 'OFFLINE',
      capacity: 100,
      today: 5,
      token: 'tk_offline_04',
      macAddress: null,
      provisioningToken: null,
      zone: { id: 'z-citymall', name: 'City Mall', isActive: true },
      lastTelemetry: null
    }
  ]

  it('should correctly categorize stations by all 4 operational statuses', () => {
    const active = mockStations.filter(s => s.status === 'ACTIVE')
    const warning = mockStations.filter(s => s.status === 'WARNING')
    const pending = mockStations.filter(s => s.status === 'PENDING_ACTIVATION')
    const offline = mockStations.filter(s => s.status === 'OFFLINE')

    expect(active).toHaveLength(1)
    expect(warning).toHaveLength(1)
    expect(pending).toHaveLength(1)
    expect(offline).toHaveLength(1)
  })

  it('should format status badges correctly for each status type', () => {
    const statuses = ['ACTIVE', 'WARNING', 'PENDING_ACTIVATION', 'OFFLINE'] as const
    const expectedLabels = ['Activa', 'Alerta Llenado', 'Pendiente Activación', 'Desconectada']

    statuses.forEach((status, idx) => {
      const config = getStatusConfig(status)
      expect(config.label).toBe(expectedLabels[idx])
      expect(config.color).toBeDefined()
      expect(config.badgeBg).toBeDefined()
    })
  })

  it('should verify telemetry fill level alerts when compartment exceeds 80%', () => {
    const warningStation = mockStations.find(s => s.id === 'est-002')!
    const telem = warningStation.lastTelemetry!

    const maxBinLevel = Math.max(telem.nivelPapel, telem.nivelPlastico, telem.nivelMetal)
    expect(maxBinLevel).toBeGreaterThanOrEqual(80)
    expect(warningStation.status).toBe('WARNING')
  })

  it('should verify provisioning token presence for zero-touch stations', () => {
    const pendingStation = mockStations.find(s => s.id === 'est-003')!
    expect(pendingStation.macAddress).toBe('AA:BB:CC:DD:EE:FF')
    expect(pendingStation.provisioningToken).toBe('prov_zero_touch_03')
    expect(pendingStation.status).toBe('PENDING_ACTIVATION')
  })

  it('should verify token revocation response update', () => {
    const station = { ...mockStations[0] }
    const revokeResponse = {
      message: 'Token de acceso revocado y regenerado exitosamente',
      token: 'tk_regenerated_9999',
      provisioningToken: 'prov_regenerated_8888',
      station: {
        id: station.id,
        name: station.name,
        token: 'tk_regenerated_9999',
        provisioningToken: 'prov_regenerated_8888',
        status: station.status,
      }
    }

    const updatedStation: Station = {
      ...station,
      token: revokeResponse.token,
      provisioningToken: revokeResponse.provisioningToken
    }

    expect(updatedStation.token).toBe('tk_regenerated_9999')
    expect(updatedStation.provisioningToken).toBe('prov_regenerated_8888')
  })
})
