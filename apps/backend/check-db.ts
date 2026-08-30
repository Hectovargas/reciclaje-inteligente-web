import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const qr = await prisma.qRToken.findUnique({ where: { codigo: 'QR-PLASTICO-1788055911297-cd176f' } });
  console.log("Estado del QR:", qr);
  const events = await prisma.blockchainEvent.findMany();
  console.log("Eventos Blockchain:", events);
}
main().then(() => process.exit(0));
