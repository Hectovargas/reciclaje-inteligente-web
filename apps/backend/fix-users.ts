import { PrismaClient } from '@prisma/client';
import { ethers } from 'ethers';
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany();
  for (const user of users) {
    if (!user.walletAddress) {
      const wallet = ethers.Wallet.createRandom();
      await prisma.user.update({
        where: { id: user.id },
        data: { walletAddress: wallet.address }
      });
      console.log(`Updated user ${user.email} with wallet ${wallet.address}`);
    }
  }
}
main().then(() => process.exit(0));
