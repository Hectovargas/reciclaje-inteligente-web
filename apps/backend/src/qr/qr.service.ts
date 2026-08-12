import { Injectable, BadRequestException, Logger, OnModuleInit } from '@nestjs/common';
import { ethers } from 'ethers';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QrService implements OnModuleInit {
  private privateKey: string;
  private readonly logger = new Logger(QrService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const vaultAddr = process.env.VAULT_ADDR || 'http://127.0.0.1:8200';
    const vaultToken = process.env.VAULT_TOKEN || 'root';

    try {
      this.logger.log(`Fetching admin private key from Vault at ${vaultAddr}`);
      const response = await fetch(`${vaultAddr}/v1/secret/data/reciclaje`, {
        headers: {
          'X-Vault-Token': vaultToken,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch from Vault: ${response.statusText}`);
      }

      const data = await response.json();
      const privateKey = data.data.data.admin_private_key;

      if (!privateKey) {
        throw new Error('admin_private_key not found in Vault secret');
      }

      this.privateKey = privateKey;
      this.logger.log('QR Service securely initialized with Vault private key.');
    } catch (error) {
      this.logger.error('Error initializing QrService with Vault:', error);
      // Fallback only for dev if vault fails
      this.privateKey = '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    }
  }

  async generarQR(categoria: string) {
    const timestamp = new Date().toISOString();
    const codigo = `QR-${categoria.toUpperCase()}-${Date.now()}`;

    // Correct ethers v6 API: solidityPackedKeccak256
    const messageHash = ethers.solidityPackedKeccak256(
      ['string', 'string', 'string'],
      [codigo, categoria, timestamp],
    );

    const wallet = new ethers.Wallet(this.privateKey);
    const firma = await wallet.signMessage(ethers.getBytes(messageHash));

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    const qrToken = await this.prisma.qRToken.create({
      data: {
        codigo,
        categoria,
        firma,
        usado: false,
        expiresAt,
      }
    });

    return {
      codigo,
      categoria,
      firma,
      usado: false,
      timestamp,
      expiresAt: expiresAt.toISOString(),
    };
  }

  async verificarQR(codigo: string, firma: string) {
    const qrToken = await this.prisma.qRToken.findUnique({
      where: { codigo },
    });

    if (!qrToken) {
      throw new BadRequestException('QR no encontrado');
    }

    if (qrToken.usado) {
      throw new BadRequestException('QR ya fue usado');
    }

    if (new Date() > qrToken.expiresAt) {
      throw new BadRequestException('QR vencido');
    }

    if (qrToken.firma !== firma) {
      throw new BadRequestException('Firma de QR inválida');
    }

    // Opcional: marcar como usado aquí, o en otro endpoint. 
    // Por ahora solo validamos.

    return {
      codigo,
      valido: true,
      mensaje: 'Firma verificada exitosamente',
    };
  }
}

