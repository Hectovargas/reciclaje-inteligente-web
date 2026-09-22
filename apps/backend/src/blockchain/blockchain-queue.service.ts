import { Injectable, Logger, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainEventStatus } from '@prisma/client';
import { ethers } from 'ethers';

export const BLOCKCHAIN_QUEUE_NAME = 'blockchain-batch-mint';

export interface QueueMintPayload {
  eventId?: string;
  recipient?: string;
  amount?: number;
  fromAddress?: string;
  timestamp: number;
}

export interface QueueMintResult {
  event: any;
  jobId: string;
}

@Injectable()
export class BlockchainQueueService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainQueueService.name);

  constructor(
    @InjectQueue(BLOCKCHAIN_QUEUE_NAME)
    private readonly batchMintQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    try {
      await this.batchMintQueue.add(
        'periodic-batch-flush',
        { timestamp: Date.now() },
        {
          repeat: {
            every: 60 * 1000, // Cada 60 segundos revisa y procesa eventos PENDING
          },
          jobId: 'periodic-batch-flush',
          removeOnComplete: 10,
          removeOnFail: 20,
        },
      );
      this.logger.log('Batch minting programado: trabajo repetible encolado cada 60s en BullMQ.');
    } catch (error) {
      this.logger.warn(`No se pudo programar el trabajo repetible en BullMQ: ${(error as Error).message}`);
    }
  }

  /**
   * Enqueues a reward minting request and records a PENDING BlockchainEvent in the database.
   * @param recipient Target EVM wallet address
   * @param amount Token reward amount
   * @param fromAddress Optional sender/operator address
   */
  async queueMintReward(
    recipient: string,
    amount: number,
    fromAddress?: string,
  ): Promise<QueueMintResult> {
    if (!ethers.isAddress(recipient)) {
      throw new BadRequestException(`Dirección EVM inválida: ${recipient}`);
    }

    if (!amount || amount <= 0) {
      throw new BadRequestException('La cantidad debe ser mayor que 0');
    }

    const normalizedRecipient = ethers.getAddress(recipient);
    const normalizedFrom = fromAddress && ethers.isAddress(fromAddress)
      ? ethers.getAddress(fromAddress)
      : '0x0000000000000000000000000000000000000000';

    // 1. Create PENDING blockchain event in PostgreSQL
    const event = await this.prisma.blockchainEvent.create({
      data: {
        fromAddress: normalizedFrom,
        toAddress: normalizedRecipient,
        amount,
        status: BlockchainEventStatus.PENDING,
      },
    });

    // 2. Add job to BullMQ queue with exponential retry backoff
    const job = await this.batchMintQueue.add(
      'mint-reward',
      {
        eventId: event.id,
        recipient: normalizedRecipient,
        amount,
        fromAddress: normalizedFrom,
        timestamp: Date.now(),
      } as QueueMintPayload,
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1500,
        },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    );

    this.logger.log(
      `Mint reward queued: ${amount} RECI for ${normalizedRecipient} (Event ID: ${event.id}, Job ID: ${job.id})`,
    );

    return {
      event,
      jobId: job.id?.toString() || 'unknown',
    };
  }

  /**
   * Encola un BlockchainEvent que YA existe en la BD (creado por QrService).
   * No crea un registro nuevo — solo agrega el job a BullMQ.
   */
  async enqueueExistingEvent(
    eventId: string,
    recipient: string,
    amount: number,
    fromAddress?: string,
  ): Promise<string> {
    const normalizedRecipient = ethers.isAddress(recipient)
      ? ethers.getAddress(recipient)
      : recipient;
    const normalizedFrom =
      fromAddress && ethers.isAddress(fromAddress)
        ? ethers.getAddress(fromAddress)
        : '0x0000000000000000000000000000000000000000';

    const job = await this.batchMintQueue.add(
      'mint-reward',
      {
        eventId,
        recipient: normalizedRecipient,
        amount,
        fromAddress: normalizedFrom,
        timestamp: Date.now(),
      } as QueueMintPayload,
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1500 },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    );

    this.logger.log(
      `Existing event ${eventId} enqueued in BullMQ (Job ID: ${job.id})`,
    );

    return job.id?.toString() || 'unknown';
  }

  /**
   * Retrieves queue counts for monitoring.
   */
  async getQueueStats() {
    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        this.batchMintQueue.getWaitingCount(),
        this.batchMintQueue.getActiveCount(),
        this.batchMintQueue.getCompletedCount(),
        this.batchMintQueue.getFailedCount(),
        this.batchMintQueue.getDelayedCount(),
      ]);

      return {
        waiting,
        active,
        completed,
        failed,
        delayed,
      };
    } catch (error) {
      this.logger.warn(`Could not fetch BullMQ queue stats: ${(error as Error).message}`);
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
      };
    }
  }
}
