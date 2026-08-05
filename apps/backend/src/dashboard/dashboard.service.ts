import { Injectable } from '@nestjs/common';

@Injectable()
export class DashboardService {
  async obtenerMetricasAgregadas() {
    return {
      totalRecicladoKg: 1360,
      confianzaPromedio: 0.964,
      tokensEmitidos: 482,
      eventosProcesados: 2410,
      desglosePorMaterial: {
        plastico: 320,
        vidrio: 190,
        cartonPapel: 450,
        metal: 120,
        organico: 280,
      },
      distribucionPorZona: {
        zonaNorte: 40,
        zonaCentro: 25,
        zonaSur: 20,
        campusPrincipal: 15,
      },
    };
  }
}
