import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerMetricasAgregadas() {
    const totalEventos = await this.prisma.eventoClasificacion.count();
    
    const papelCount = await this.prisma.eventoClasificacion.count({ where: { categoria: 'Papel' } });
    const plasticoCount = await this.prisma.eventoClasificacion.count({ where: { categoria: 'Plástico' } });
    const metalCount = await this.prisma.eventoClasificacion.count({ where: { categoria: 'Metal' } });

    const total = totalEventos || 1; // Prevent division by zero
    
    // Recent events for live feed
    const recentEvents = await this.prisma.eventoClasificacion.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' },
      include: { station: true },
    });

    const feedInit = recentEvents.map((evt) => ({
      id: evt.id,
      type: evt.categoria,
      station: evt.station?.id || 'Unknown',
      time: evt.timestamp.toISOString(),
      material: evt.categoria === 'Papel' ? 'paper' : evt.categoria === 'Plástico' ? 'plastic' : 'metal'
    }));

    const zones = await this.prisma.zone.findMany({
      include: { stations: true }
    });
    
    const zonesData = zones.map(z => ({
      id: z.id,
      name: z.name,
      value: Math.floor(Math.random() * 40) + 5, // mock relative value for heatmap
      todayCount: Math.floor(Math.random() * 5000) + 500,
      prevCount: Math.floor(Math.random() * 5000) + 500,
      stations: z.stations.map(s => ({
        id: s.id,
        name: s.name,
        fill: s.capacity,
        status: s.status,
        last: 'Papel' // mocked recent event
      }))
    }));

    return {
      kgTotal: totalEventos * 1.5,
      kgSaved: totalEventos * 1.3,
      accuracy: 98.3,
      aiConf: 96,
      timeBetweenEmptying: 6.2,
      timeBetweenEmptyingPrev: 6.8,
      efficiencyGainPct: 8,
      frequency: "14 / sem",
      minZoneTime: "2.4h",
      maxZoneTime: "11.8h",
      totalEst: "7 est.",
      materialBreakdown: [
        { name: 'Papel', count: papelCount, pct: ((papelCount/total)*100).toFixed(1), color: '#a3e635' },
        { name: 'Plástico', count: plasticoCount, pct: ((plasticoCount/total)*100).toFixed(1), color: '#22d3ee' },
        { name: 'Metal', count: metalCount, pct: ((metalCount/total)*100).toFixed(1), color: '#a78bfa' },
      ],
      iaAccuracyBreakdown: [
        { label: 'Papel', color: '#a3e635', val: 99.1 },
        { label: 'Plástico', color: '#22d3ee', val: 97.8 },
        { label: 'Metal', color: '#a78bfa', val: 98.2 },
      ],
      peakData: {
        hoy: [12,8,5,3,4,9,18,42,61,74,82,88,95,91,78,65,70,84,76,55,38,28,19,14],
        semana: [10,7,4,3,4,8,22,48,67,79,85,90,92,89,82,72,75,86,80,62,44,32,22,15],
      },
      feedInit,
      zonesData
    };
  }

  async getStations() {
    const stations = await this.prisma.station.findMany({
      include: { zone: true },
    });
    return stations.map((s) => ({
      id: s.id,
      name: s.name,
      location: s.location,
      // Normalize to lowercase so it matches the frontend Station type ('active' | 'warning' | 'offline')
      status: s.status.toLowerCase() as 'active' | 'warning' | 'offline',
      capacity: s.capacity,
      zone: s.zone?.name || 'Unassigned',
      today: Math.round(s.capacity * 4.2), // Mock current fill similarly to frontend fallback
      token: `tk_${s.id.toLowerCase().replace(/[^a-z0-9]/g, '')}_auth`, // Mock token
    }));
  }
}
