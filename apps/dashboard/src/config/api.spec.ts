import { getStatusConfig, getStationZoneName, getStationFromZoneItem, fetchWithAuth, STATUS_CONFIG } from './api'

describe('Dashboard API and Station Status Helpers', () => {
  describe('getStatusConfig', () => {
    it('should correctly configure ACTIVE status in both upper and lower case', () => {
      const activeUpper = getStatusConfig('ACTIVE')
      const activeLower = getStatusConfig('active')

      expect(activeUpper.label).toBe('Activa')
      expect(activeUpper.color).toBe('#34d399')
      expect(activeUpper.ring).toBe('status-ring-active')
      expect(activeLower.label).toBe('Activa')
    })

    it('should correctly configure WARNING status in both upper and lower case', () => {
      const warningUpper = getStatusConfig('WARNING')
      const warningLower = getStatusConfig('warning')

      expect(warningUpper.label).toBe('Alerta Llenado')
      expect(warningUpper.color).toBe('#fbbf24')
      expect(warningUpper.ring).toBe('status-ring-warning')
      expect(warningLower.label).toBe('Alerta Llenado')
    })

    it('should correctly configure PENDING_ACTIVATION status for ESP32 zero-touch provisioning', () => {
      const pendingUpper = getStatusConfig('PENDING_ACTIVATION')
      const pendingLower = getStatusConfig('pending_activation')

      expect(pendingUpper.label).toBe('Pendiente Activación')
      expect(pendingUpper.color).toBe('#38bdf8')
      expect(pendingUpper.ring).toBe('status-ring-pending')
      expect(pendingLower.label).toBe('Pendiente Activación')
    })

    it('should correctly configure OFFLINE status in both upper and lower case', () => {
      const offlineUpper = getStatusConfig('OFFLINE')
      const offlineLower = getStatusConfig('offline')

      expect(offlineUpper.label).toBe('Desconectada')
      expect(offlineUpper.color).toBe('#ef4444')
      expect(offlineUpper.ring).toBe('status-ring-offline')
      expect(offlineLower.label).toBe('Desconectada')
    })

    it('should return fallback config for unknown or undefined status', () => {
      const emptyStatus = getStatusConfig(undefined)
      expect(emptyStatus.label).toBe('Desconectada')

      const customStatus = getStatusConfig('MAINTENANCE_REQUIRED')
      expect(customStatus.label).toBe('MAINTENANCE_REQUIRED')
      expect(customStatus.color).toBe('#94a3b8')
    })
  })

  describe('getStationZoneName', () => {
    it('should extract name when zone is an object', () => {
      const station = {
        id: 'est-1',
        name: 'Estación Central',
        location: 'Plaza Principal',
        zone: { id: 'z1', name: 'UNITEC San Pedro Sula', isActive: true },
        status: 'ACTIVE' as const,
        capacity: 100,
        today: 15,
        token: 'tk_test123',
      }
      expect(getStationZoneName(station)).toBe('UNITEC San Pedro Sula')
    })

    it('should return string directly when zone is a string', () => {
      const station = {
        id: 'est-2',
        name: 'Estación 2',
        location: 'Piso 2',
        zone: 'Altara',
        status: 'ACTIVE' as const,
        capacity: 100,
        today: 0,
        token: 'tk_test456',
      }
      expect(getStationZoneName(station)).toBe('Altara')
    })

    it('should return "Sin Zona" when zone is null or undefined', () => {
      const station = {
        id: 'est-3',
        name: 'Estación 3',
        location: 'Piso 3',
        zone: null,
        status: 'OFFLINE' as const,
        capacity: 100,
        today: 0,
        token: 'tk_test789',
      }
      expect(getStationZoneName(station)).toBe('Sin Zona')
    })
  })

  describe('getStationFromZoneItem', () => {
    it('should create a valid station model from zone items', () => {
      const item = {
        id: 'EST-99',
        name: 'Estación Campus',
        fill: 75,
        status: 'ACTIVE',
      }
      const result = getStationFromZoneItem(item, 'Zona Norte')

      expect(result.id).toBe('EST-99')
      expect(result.name).toBe('Estación Campus')
      expect(result.zone).toBe('Zona Norte')
      expect(result.location).toBe('Zona Norte')
      expect(result.capacity).toBe(75)
      expect(result.status).toBe('ACTIVE')
      expect(result.token).toContain('tk_est99_auth')
    })
  })

  describe('fetchWithAuth', () => {
    beforeEach(() => {
      // Mock global fetch
      (global as any).fetch = jest.fn()
    })

    afterEach(() => {
      jest.resetAllMocks()
    })

    it('should send credentials include and content-type header', async () => {
      const mockResponse = { id: '123', name: 'Test' };
      (global as any).fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const data = await fetchWithAuth('/estaciones')
      expect(data).toEqual(mockResponse)
      expect((global as any).fetch).toHaveBeenCalledWith('/api/v1/estaciones', expect.objectContaining({
        credentials: 'include',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        })
      }))
    })

    it('should throw detailed error message when response is not ok', async () => {
      (global as any).fetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ message: 'La dirección MAC ya está registrada' }),
      })

      await expect(fetchWithAuth('/estaciones', { method: 'POST' })).rejects.toThrow('La dirección MAC ya está registrada')
    })
  })
})
