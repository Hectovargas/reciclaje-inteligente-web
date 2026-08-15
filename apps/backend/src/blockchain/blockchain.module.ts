import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { BlockchainService } from './blockchain.service';
import { WalletEncryptionService } from './wallet-encryption.service';
import { BlockchainQueueService, BLOCKCHAIN_QUEUE_NAME } from './blockchain-queue.service';
import { BatchMintProcessor } from './batch-mint.processor';
import { BlockchainController } from './blockchain.controller';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    BullModule.registerQueue({
      name: BLOCKCHAIN_QUEUE_NAME,
    }),
  ],
  controllers: [BlockchainController],
  providers: [
    BlockchainService,
    WalletEncryptionService,
    BlockchainQueueService,
    BatchMintProcessor,
  ],
  exports: [
    BlockchainService,
    WalletEncryptionService,
    BlockchainQueueService,
  ],
})
export class BlockchainModule {}
