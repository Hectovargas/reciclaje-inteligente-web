import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const randomHex = Math.random().toString(16).slice(2, 8);
  const codigo = `QR-VIDRIO-${Date.now()}-${randomHex}`;
  await prisma.qRToken.create({
    data: {
      codigo,
      categoria: 'Vidrio',
      firma: '0x00',
      usado: false,
      expiresAt: new Date(Date.now() + 86400000) // 1 day
    }
  });
  console.log(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${codigo}`);
}
main().then(() => process.exit(0));
