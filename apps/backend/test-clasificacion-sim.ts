import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000/api/v1';
const STATION_TOKEN = process.env.STATION_TOKEN || 'tk_prototipo_v1_recycle_ai_2026';

async function main() {
  console.log('--- Simulación de Detección IA (Recycle_AI -> Backend) ---\n');

  const prisma = new PrismaClient();
  const station = await prisma.station.findUnique({
    where: { token: STATION_TOKEN },
    include: { zone: true },
  });

  if (!station) {
    console.error(`❌ Estación con token ${STATION_TOKEN} no encontrada en la BD.`);
    console.error('Ejecuta primero: npx ts-node seed-station.ts');
    process.exit(1);
  }

  console.log(`Estación emisora: ${station.name} (${station.id})`);
  console.log(`Zona: ${station.zone?.name || 'Sin zona'}`);

  const sampleMaterial = process.argv[2] || 'Plástico';
  const sampleConf = parseFloat(process.argv[3] || '0.94');

  const payload = {
    stationId: station.id,
    categoria: sampleMaterial,
    confianza: sampleConf,
    peso: 0.25,
    timestamp: new Date().toISOString(),
  };

  console.log('\nEnviando evento de clasificación simulado:');
  console.log(JSON.stringify(payload, null, 2));

  try {
    const response = await axios.post(`${BACKEND_URL}/clasificacion`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Station-Token': STATION_TOKEN,
      },
      timeout: 5000,
    });

    console.log('\n✅ Evento recibido y procesado por el backend exitosamente (HTTP 201):');
    console.log(JSON.stringify(response.data, null, 2));

    if (response.data.qr) {
      console.log('\n📱 CÓDIGO QR GENERADO:');
      console.log(`Código: ${response.data.qr.codigo}`);
      console.log(`Puntos: ${response.data.qr.puntos}`);
      console.log(`Expira: ${response.data.qr.expiresAt}`);
      console.log(`\nVer imagen del QR en el navegador:`);
      console.log(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${response.data.qr.codigo}`);
    }
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED') {
      console.warn(`\n⚠️ El servidor backend no está escuchando en ${BACKEND_URL}.`);
      console.log('Creando evento directamente en la base de datos para verificación...');

      const evento = await prisma.eventoClasificacion.create({
        data: {
          stationId: station.id,
          categoria: payload.categoria,
          confianza: payload.confianza,
        },
      });

      console.log('✅ Evento registrado directamente en DB:', evento);
    } else {
      console.error('❌ Error al enviar evento:', error.response?.data || error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
