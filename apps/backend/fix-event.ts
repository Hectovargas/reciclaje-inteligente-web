import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const admin = await prisma.user.findUnique({ where: { email: 'admin@recicla.com' } });
  if (admin && admin.walletAddress) {
    await prisma.blockchainEvent.updateMany({
      where: { amount: 10 },
      data: { toAddress: admin.walletAddress }
    });
    console.log(`Linked events to ${admin.walletAddress}`);
  }
}
main().then(() => process.exit(0));
