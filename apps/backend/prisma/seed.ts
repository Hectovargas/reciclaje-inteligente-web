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
