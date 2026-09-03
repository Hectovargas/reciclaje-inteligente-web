import { PrismaClient, StationStatus } from '@prisma/client';

const prisma = new PrismaClient();

const STATION_NAME = 'Estacion_prototipo_v1';
const STATION_TOKEN = 'tk_prototipo_v1_recycle_ai_2026';
const ZONE_NAME = 'Zona Prototipo';

async function main() {
  console.log('--- Aprovisionando Estacion_prototipo_v1 ---');

  // 1. Asegurar la existencia de la zona
  const zone = await prisma.zone.upsert({
    where: { name: ZONE_NAME },
    update: { isActive: true },
    create: {
      name: ZONE_NAME,
      isActive: true,
    },
  });
  console.log(`Zona asegurada: ${zone.name} (ID: ${zone.id})`);

  // 2. Buscar si ya existe la estación por token
  const existingByToken = await prisma.station.findUnique({
    where: { token: STATION_TOKEN },
  });

  let station;
  if (existingByToken) {
    station = await prisma.station.update({
      where: { id: existingByToken.id },
      data: {
        name: STATION_NAME,
        location: 'Laboratorio Prototipo / Taller Recycle_AI',
        status: StationStatus.ACTIVE,
        capacity: 100,
        zoneId: zone.id,
        lastPingAt: new Date(),
      },
    });
    console.log(`Estación existente actualizada con éxito.`);
  } else {
    // Buscar si existe por nombre
    const existingByName = await prisma.station.findFirst({
      where: { name: STATION_NAME },
    });

    if (existingByName) {
      station = await prisma.station.update({
        where: { id: existingByName.id },
        data: {
          token: STATION_TOKEN,
          status: StationStatus.ACTIVE,
          capacity: 100,
          location: 'Laboratorio Prototipo / Taller Recycle_AI',
          zoneId: zone.id,
          lastPingAt: new Date(),
        },
      });
      console.log(`Estación actualizada con nuevo token.`);
    } else {
      station = await prisma.station.create({
        data: {
          name: STATION_NAME,
          location: 'Laboratorio Prototipo / Taller Recycle_AI',
          status: StationStatus.ACTIVE,
          capacity: 100,
          token: STATION_TOKEN,
          zoneId: zone.id,
          lastPingAt: new Date(),
        },
      });
      console.log(`Estación creada con éxito.`);
    }
  }

  console.log('\n======================================================');
  console.log('✅ ESTACIÓN PROTOTIPO LISTA PARA RECYCLE_AI');
  console.log('======================================================');
  console.log(`ID de Estación : ${station.id}`);
  console.log(`Nombre         : ${station.name}`);
  console.log(`Estado         : ${station.status}`);
  console.log(`Token          : ${station.token}`);
  console.log(`Zona           : ${zone.name} (${zone.id})`);
  console.log('======================================================');
  console.log('\nCopia las siguientes líneas en Recycle_AI/.env:');
  console.log('------------------------------------------------------');
  console.log(`BACKEND_URL=http://localhost:3000/api/v1`);
  console.log(`STATION_ID=${station.id}`);
  console.log(`STATION_TOKEN=${station.token}`);
  console.log('------------------------------------------------------\n');
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Error al aprovisionar estación:', e);
    process.exit(1);
  });
