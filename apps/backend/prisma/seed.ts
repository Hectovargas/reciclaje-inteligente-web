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

  // 2. Create Zona Prototipo & Estacion_prototipo_v1
  const zone = await prisma.zone.upsert({
    where: { name: 'Zona Prototipo' },
    update: { isActive: true },
    create: {
      name: 'Zona Prototipo',
      isActive: true,
    },
  });

  const station = await prisma.station.upsert({
    where: { token: 'tk_prototipo_v1_recycle_ai_2026' },
    update: {
      name: 'Estacion_prototipo_v1',
      status: StationStatus.ACTIVE,
      zoneId: zone.id,
    },
    create: {
      name: 'Estacion_prototipo_v1',
      location: 'Laboratorio Prototipo / Taller Recycle_AI',
      status: StationStatus.ACTIVE,
      capacity: 100,
      token: 'tk_prototipo_v1_recycle_ai_2026',
      zoneId: zone.id,
    },
  });
  console.log(`Station created: ${station.name} (${station.id}) with token ${station.token}`);

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
