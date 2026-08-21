import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerMetricasAgregadas() {
    const totalEventos = await this.prisma.eventoClasificacion.count();
    
    const [papelCount, plasticoCount, metalCount] = await Promise.all([
      this.prisma.eventoClasificacion.count({ where: { categoria: 'Papel' } }),
      this.prisma.eventoClasificacion.count({ where: { categoria: 'Plástico' } }),
      this.prisma.eventoClasificacion.count({ where: { categoria: 'Metal' } }),
    ]);

    const total = totalEventos || 1;

    const [avgAll, avgPapel, avgPlastico, avgMetal] = await Promise.all([
      this.prisma.eventoClasificacion.aggregate({ _avg: { confianza: true } }),
      this.prisma.eventoClasificacion.aggregate({ where: { categoria: 'Papel' }, _avg: { confianza: true } }),
      this.prisma.eventoClasificacion.aggregate({ where: { categoria: 'Plástico' }, _avg: { confianza: true } }),
      this.prisma.eventoClasificacion.aggregate({ where: { categoria: 'Metal' }, _avg: { confianza: true } }),
    ]);

    const accuracyVal = avgAll._avg.confianza ? Math.round(avgAll._avg.confianza * 1000) / 10 : 0;
    const aiConfVal = avgAll._avg.confianza ? Math.round(avgAll._avg.confianza * 100) : 0;

    const papelVal = avgPapel._avg.confianza ? Math.round(avgPapel._avg.confianza * 1000) / 10 : 0;
    const plasticoVal = avgPlastico._avg.confianza ? Math.round(avgPlastico._avg.confianza * 1000) / 10 : 0;
    const metalVal = avgMetal._avg.confianza ? Math.round(avgMetal._avg.confianza * 1000) / 10 : 0;
    
    const recentEvents = await this.prisma.eventoClasificacion.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' },
      include: { station: true },
    });

    const feedInit = recentEvents.map((evt) => ({
      id: evt.id,
      type: evt.categoria,
      station: evt.station?.name || evt.station?.id || 'Desconocida',
      time: evt.timestamp.toISOString(),
      material: evt.categoria === 'Papel' ? 'paper' : evt.categoria === 'Plástico' ? 'plastic' : 'metal'
    }));

    const totalStationsCount = await this.prisma.station.count();

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const zones = await this.prisma.zone.findMany({
      where: { isActive: true },
      include: {
        stations: {
          include: {
            telemetrias: {
              orderBy: { timestamp: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    const [eventsToday, eventsWeek, eventsYear, totalEventsTodayCount] = await Promise.all([
      this.prisma.eventoClasificacion.findMany({
        where: { timestamp: { gte: startOfToday } },
        select: { timestamp: true }
      }),
      this.prisma.eventoClasificacion.findMany({
        where: { timestamp: { gte: startOfWeek } },
        select: { timestamp: true }
      }),
      this.prisma.eventoClasificacion.findMany({
        where: { timestamp: { gte: startOfYear } },
        select: { timestamp: true, categoria: true }
      }),
      this.prisma.eventoClasificacion.count({
        where: { timestamp: { gte: startOfToday } },
      }),
    ]);

    const zonesData = await Promise.all(
      zones.map(async (z) => {
        const stationIds = z.stations.map((s) => s.id);
        const [todayCount, prevCount] = await Promise.all([
          this.prisma.eventoClasificacion.count({
            where: { stationId: { in: stationIds }, timestamp: { gte: startOfToday } },
          }),
          this.prisma.eventoClasificacion.count({
            where: { stationId: { in: stationIds }, timestamp: { gte: startOfYesterday, lt: startOfToday } },
          }),
        ]);
        const value = totalEventsTodayCount > 0 ? Math.round((todayCount / totalEventsTodayCount) * 100) : 0;
        return {
          id: z.id,
          name: z.name,
          value,
          todayCount,
          prevCount,
          stations: z.stations.map((s) => {
            const lastTelem = s.telemetrias?.[0];
            const fillLevel = lastTelem
              ? Math.round((lastTelem.nivelPapel + lastTelem.nivelPlastico + lastTelem.nivelMetal) / 3)
              : 0;
            return {
              id: s.id,
              name: s.name,
              fill: fillLevel,
              status: s.status.toLowerCase(),
              last: lastTelem ? lastTelem.timestamp.toISOString() : '',
            };
          }),
        };
      })
    );

    const hoyArr = Array(24).fill(0);
    for (const evt of eventsToday) {
      hoyArr[evt.timestamp.getHours()]++;
    }

    const semanaArr = Array(24).fill(0);
    for (const evt of eventsWeek) {
      semanaArr[evt.timestamp.getHours()]++;
    }
    for (let i = 0; i < 24; i++) {
      semanaArr[i] = Math.round((semanaArr[i] / 7) * 10) / 10;
    }

    const monthlyData = {
      paper: Array(12).fill(0),
      plastic: Array(12).fill(0),
      metal: Array(12).fill(0)
    };
    
    for (const evt of eventsYear) {
      const month = evt.timestamp.getMonth();
      if (evt.categoria === 'Papel') monthlyData.paper[month]++;
      else if (evt.categoria === 'Plástico') monthlyData.plastic[month]++;
      else if (evt.categoria === 'Metal') monthlyData.metal[month]++;
    }

    return {
      kgTotal: totalEventos,
      kgSaved: totalEventos,
      accuracy: accuracyVal,
      aiConf: aiConfVal,
      timeBetweenEmptying: 0,
      timeBetweenEmptyingPrev: 0,
      efficiencyGainPct: 0,
      frequency: "0 / sem",
      minZoneTime: "0h",
      maxZoneTime: "0h",
      totalEst: `${totalStationsCount} est.`,
      materialBreakdown: [
        { name: 'Papel', count: papelCount, pct: totalEventos > 0 ? ((papelCount/total)*100).toFixed(1) : '0.0', color: '#a3e635' },
        { name: 'Plástico', count: plasticoCount, pct: totalEventos > 0 ? ((plasticoCount/total)*100).toFixed(1) : '0.0', color: '#22d3ee' },
        { name: 'Metal', count: metalCount, pct: totalEventos > 0 ? ((metalCount/total)*100).toFixed(1) : '0.0', color: '#a78bfa' },
      ],
      iaAccuracyBreakdown: [
        { label: 'Papel', color: '#a3e635', val: papelVal },
        { label: 'Plástico', color: '#22d3ee', val: plasticoVal },
        { label: 'Metal', color: '#a78bfa', val: metalVal },
      ],
      peakData: {
        hoy: hoyArr,
        semana: semanaArr,
      },
      monthlyData,
      feedInit,
      zonesData
    };
  }

  async getStations() {
    const stations = await this.prisma.station.findMany({
      include: { zone: true, events: true, telemetrias: { orderBy: { timestamp: 'desc' }, take: 1 } },
    });
    return stations.map((s) => ({
      id: s.id,
      name: s.name,
      location: s.location,
      status: s.status.toLowerCase() as 'active' | 'warning' | 'offline',
      capacity: s.capacity,
      zone: s.zone?.name || 'Sin Asignar',
      zoneId: s.zoneId,
      today: s.events?.length || 0,
      token: s.token,
      macAddress: s.macAddress,
      provisioningToken: s.provisioningToken,
      lastPingAt: s.lastPingAt,
      lastTelemetry: s.telemetrias?.[0] || null,
    }));
  }

  async createStation(data: any) {
    const token = 'tk_' + Math.random().toString(36).slice(2, 14);
    const station = await this.prisma.station.create({
      data: {
        name: data.name,
        location: data.location,
        zoneId: data.zoneId,
        status: 'OFFLINE',
        token,
      },
      include: { zone: true, events: true }
    });
    
    return {
      id: station.id,
      name: station.name,
      location: station.location,
      status: station.status.toLowerCase() as 'active' | 'warning' | 'offline',
      capacity: station.capacity,
      zone: station.zone?.name || 'Sin Asignar',
      zoneId: station.zoneId,
      today: station.events?.length || 0,
      token: station.token,
    };
  }

  async updateStation(id: string, data: any) {
    return this.prisma.station.update({
      where: { id },
      data: {
        ...data,
      },
    });
  }
}
