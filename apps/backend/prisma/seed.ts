import { PrismaClient, Role, StationStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Admin User
  const passwordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@recicla.com' },
    update: {},
    create: {
      email: 'admin@recicla.com',
      password: passwordHash,
      name: 'Admin Principal',
      role: Role.ADMIN,
    },
  });
  console.log(`User created: ${admin.email}`);

  // 2. Create Zones
  const zonesData = [
    { name: 'UNITEC' },
    { name: 'Altara' },
    { name: 'Altia' },
    { name: 'City Mall' },
    { name: 'Mall Galerias' },
    { name: 'Mega Mall' },
  ];

  for (const zoneData of zonesData) {
    await prisma.zone.upsert({
      where: { name: zoneData.name },
      update: {},
      create: zoneData,
    });
  }
  console.log('Zones created');

  // 3. Create Stations
  const unitecZone = await prisma.zone.findUnique({ where: { name: 'UNITEC' } });
  if (unitecZone) {
    const stations = [
      {
        name: 'Plaza Principal UNITEC',
        location: 'Campus UNITEC',
        status: StationStatus.ACTIVE,
        capacity: 100,
        token: 'tk_a9f2bc41e7d3',
        zoneId: unitecZone.id,
      },
      {
        name: 'Edificio 2 UNITEC',
        location: 'Campus UNITEC',
        status: StationStatus.ACTIVE,
        capacity: 100,
        token: 'tk_e3b1c90d4f82',
        zoneId: unitecZone.id,
      },
    ];

    for (const station of stations) {
      await prisma.station.upsert({
        where: { token: station.token },
        update: {},
        create: station,
      });
    }
    console.log('Stations created');
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
