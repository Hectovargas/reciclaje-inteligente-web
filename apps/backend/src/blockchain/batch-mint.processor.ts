import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from './blockchain.service';
import { BLOCKCHAIN_QUEUE_NAME, QueueMintPayload } from './blockchain-queue.service';
import { BlockchainEventStatus } from '@prisma/client';

@Processor(BLOCKCHAIN_QUEUE_NAME)
export class BatchMintProcessor extends WorkerHost {
  private readonly logger = new Logger(BatchMintProcessor.name);

  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<QueueMintPayload>): Promise<any> {
    this.logger.log(`Processing BullMQ job ${job.id} (Name: ${job.name})...`);

    // 1. Query pending events to batch up to 25 items
    const pendingEvents = await this.prisma.blockchainEvent.findMany({
      where: {
        status: BlockchainEventStatus.PENDING,
      },
      take: 25,
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (pendingEvents.length === 0) {
      // Check if this job's specific event was already processed
      if (job.data?.eventId) {
        const existing = await this.prisma.blockchainEvent.findUnique({
          where: { id: job.data.eventId },
        });
        if (existing && existing.status !== BlockchainEventStatus.PENDING) {
          this.logger.log(`Event ${job.data.eventId} already in status ${existing.status}. Skipping.`);
          return { status: existing.status, eventId: job.data.eventId };
        }
      }
      return { status: 'no_pending_events' };
    }

    const batchId = `batch-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const eventIds = pendingEvents.map((e) => e.id);

    this.logger.log(
      `Accumulated ${pendingEvents.length} pending reward events for batch ${batchId}.`,
    );

    // 2. Mark events as BATCHED in database
    await this.prisma.blockchainEvent.updateMany({
      where: {
        id: { in: eventIds },
        status: BlockchainEventStatus.PENDING,
      },
      data: {
        status: BlockchainEventStatus.BATCHED,
        batchId,
      },
    });

    const recipients = pendingEvents.map((e) => e.toAddress);
    const amounts = pendingEvents.map((e) => e.amount);

    try {
      // 3. Execute on-chain mint or mintBatch
      let result;
      if (pendingEvents.length === 1) {
        result = await this.blockchainService.mint(recipients[0], amounts[0]);
      } else {
        result = await this.blockchainService.mintBatch(recipients, amounts);
      }

      this.logger.log(
        `Batch ${batchId} successfully minted on-chain! TxHash: ${result.txHash}`,
      );

      // 4. Update events to CONFIRMED with txHash
      // Note: If txHash is identical across all events in batch, ensure update handles it.
      // Since txHash has @unique in Prisma, batch transactions share the batchId.
      // In Prisma schema: txHash String? @unique.
      // For batch minting, each row in a batch can either share a txHash (if not strictly @unique)
      // or if @unique is enforced in DB, update individually or with unique index handling.
      // Let's update each row safely:
      for (let i = 0; i < eventIds.length; i++) {
        const id = eventIds[i];
        // If multiple rows share the same txHash and DB has unique constraint on txHash,
        // we can suffix with index or use txHash if schema permits.
        // Let's check schema: txHash String? @unique.
        // In PostgreSQL with unique constraint on txHash, duplicate non-null txHash would fail.
        // So for batch of N items, if txHash is unique, we can store txHash or `${result.txHash}#${i}` if multiple.
        const rowTxHash =
          eventIds.length === 1 ? result.txHash : `${result.txHash}#${i}`;

        await this.prisma.blockchainEvent.update({
          where: { id },
          data: {
            status: BlockchainEventStatus.CONFIRMED,
            txHash: rowTxHash,
          },
        });
      }

      return {
        success: true,
        batchId,
        txHash: result.txHash,
        count: pendingEvents.length,
      };
    } catch (error) {
      this.logger.error(
        `Batch ${batchId} failed during execution: ${(error as Error).message}`,
      );

      const attemptsMade = job.attemptsMade || 0;
      const maxAttempts = job.opts?.attempts || 3;

      if (attemptsMade >= maxAttempts - 1) {
        // Final failure: mark as FAILED
        await this.prisma.blockchainEvent.updateMany({
          where: {
            batchId,
            status: BlockchainEventStatus.BATCHED,
          },
          data: {
            status: BlockchainEventStatus.FAILED,
          },
        });
      } else {
        // Revert to PENDING for retry
        await this.prisma.blockchainEvent.updateMany({
          where: {
            batchId,
            status: BlockchainEventStatus.BATCHED,
          },
          data: {
            status: BlockchainEventStatus.PENDING,
            batchId: null,
          },
        });
      }

      throw error;
    }
  }
}
