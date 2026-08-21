import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { BlockchainService } from './blockchain.service';
import { BlockchainQueueService } from './blockchain-queue.service';
import { PrismaService } from '../prisma/prisma.service';
import { QueueMintDto } from './dto/queue-mint.dto';
import {
  BalanceResponseDto,
  BlockchainStatusResponseDto,
  BlockchainEventItemDto,
} from './dto/blockchain-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ethers } from 'ethers';

@ApiTags('Blockchain')
@Controller('blockchain')
export class BlockchainController {
  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly blockchainQueueService: BlockchainQueueService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('status')
  @ApiOperation({ summary: 'Obtener estado del contrato inteligente, red y cola BullMQ' })
  @ApiResponse({
    status: 200,
    description: 'Estado del módulo blockchain retornado exitosamente',
    type: BlockchainStatusResponseDto,
  })
  async getStatus(): Promise<BlockchainStatusResponseDto> {
    const contractStatus = await this.blockchainService.getStatus();
    const queueStats = await this.blockchainQueueService.getQueueStats();

    return {
      ...contractStatus,
      queue: queueStats,
    };
  }

  @Get('balance/:address')
  @ApiOperation({ summary: 'Obtener balance de tokens ERC-20 (RECI) de una dirección EVM' })
  @ApiParam({
    name: 'address',
    description: 'Dirección EVM (0x...)',
    example: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  })
  @ApiResponse({
    status: 200,
    description: 'Balance de tokens retornado exitosamente',
    type: BalanceResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dirección EVM inválida' })
  async getBalance(@Param('address') address: string): Promise<BalanceResponseDto> {
    if (!ethers.isAddress(address)) {
      throw new BadRequestException(`Dirección EVM inválida: ${address}`);
    }

    const normalized = ethers.getAddress(address);
    const balanceResult = await this.blockchainService.getBalance(normalized);

    // If on-chain balance is 0 or contract is in queue mode, check database events
    const onChainNum = parseFloat(balanceResult.balance || '0');
    const dbSum = await this.prisma.blockchainEvent.aggregate({
      _sum: { amount: true },
      where: {
        OR: [
          { toAddress: normalized },
          { toAddress: address },
          { toAddress: address.toLowerCase() },
        ],
      },
    });
    const totalDb = dbSum._sum.amount || 0;

    if (totalDb > onChainNum) {
      return {
        ...balanceResult,
        balance: totalDb.toFixed(1),
        rawBalance: totalDb.toString(),
      };
    }

    return balanceResult;
  }

  @Get('transactions/:address')
  @ApiOperation({ summary: 'Obtener historial de transacciones de blockchain para una dirección' })
  @ApiParam({
    name: 'address',
    description: 'Dirección EVM (0x...)',
    example: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  })
  @ApiResponse({
    status: 200,
    description: 'Historial de eventos de blockchain retornado exitosamente',
    type: [BlockchainEventItemDto],
  })
  @ApiResponse({ status: 400, description: 'Dirección EVM inválida' })
  async getTransactions(@Param('address') address: string): Promise<BlockchainEventItemDto[]> {
    if (!ethers.isAddress(address)) {
      throw new BadRequestException(`Dirección EVM inválida: ${address}`);
    }

    const normalized = ethers.getAddress(address);

    const events = await this.prisma.blockchainEvent.findMany({
      where: {
        OR: [
          { toAddress: normalized },
          { toAddress: address },
          { toAddress: address.toLowerCase() },
          { fromAddress: normalized },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    return events;
  }

  @Post('queue-mint')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OPERATOR, Role.MANAGER)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Encolar minteo de tokens RECI para procesamiento por lotes con BullMQ' })
  @ApiResponse({
    status: 202,
    description: 'Recompensa encolada exitosamente para procesamiento batch',
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado (Requiere rol ADMIN, OPERATOR o MANAGER)' })
  async queueMint(@Body() dto: QueueMintDto) {
    const result = await this.blockchainQueueService.queueMintReward(
      dto.recipient,
      dto.amount,
      dto.fromAddress,
    );

    return {
      success: true,
      message: 'Recompensa de reciclaje encolada exitosamente en BullMQ',
      event: result.event,
      jobId: result.jobId,
    };
  }
}
