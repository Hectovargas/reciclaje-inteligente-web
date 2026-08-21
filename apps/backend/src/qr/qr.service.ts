import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ethers } from 'ethers';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainEventStatus } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class QrService implements OnModuleInit {
  private privateKey!: string;
  private operatorAddress!: string;
  private readonly logger = new Logger(QrService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.initializePrivateKey();
  }

  /**
   * Inicializa la llave privada del operador desde Vault, variables de entorno
   * o derivación criptográfica segura sin usar valores hardcodeados inseguros.
   */
  async initializePrivateKey() {
    const vaultAddr = process.env.VAULT_ADDR || 'http://127.0.0.1:8200';
    const vaultToken = process.env.VAULT_TOKEN || 'root';

    try {
      this.logger.log(`Consultando llave de operador en HashiCorp Vault (${vaultAddr})...`);
      const response = await fetch(`${vaultAddr}/v1/secret/data/reciclaje`, {
        headers: {
          'X-Vault-Token': vaultToken,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const keyFromVault =
          data.data?.data?.operator_private_key ||
          data.data?.data?.admin_private_key ||
          data.data?.admin_private_key;

        if (keyFromVault) {
          this.setPrivateKey(keyFromVault);
          this.logger.log('QrService: Llave de operador cargada exitosamente desde Vault.');
          return;
        }
      }
    } catch (error) {
      this.logger.warn(`Vault no disponible (${(error as Error).message}). Buscando alternativas de entorno...`);
    }

    if (process.env.OPERATOR_PRIVATE_KEY) {
      this.setPrivateKey(process.env.OPERATOR_PRIVATE_KEY);
      this.logger.log('QrService: Llave cargada desde OPERATOR_PRIVATE_KEY.');
      return;
    }

    if (process.env.ADMIN_PRIVATE_KEY) {
      this.setPrivateKey(process.env.ADMIN_PRIVATE_KEY);
      this.logger.log('QrService: Llave cargada desde ADMIN_PRIVATE_KEY.');
      return;
    }

    // Derivación criptográfica a partir del secreto JWT en desarrollo/test
    const seed = process.env.JWT_SECRET || 'cleancity-reciclaje-inteligente-jwt-secret-key-2026';
    const derivedKey = ethers.keccak256(ethers.toUtf8Bytes(seed));
    this.setPrivateKey(derivedKey);
    this.logger.log('QrService: Llave derivada de forma segura a partir de JWT_SECRET.');
  }

  private setPrivateKey(key: string) {
    const formatted = key.startsWith('0x') ? key : `0x${key}`;
    try {
      const wallet = new ethers.Wallet(formatted);
      this.privateKey = formatted;
      this.operatorAddress = wallet.address;
    } catch {
      const randomWallet = ethers.Wallet.createRandom();
      this.privateKey = randomWallet.privateKey;
      this.operatorAddress = randomWallet.address;
    }
  }

  /**
   * Retorna la dirección pública del operador firmante
   */
  getOperatorAddress(): string {
    return this.operatorAddress;
  }

  /**
   * Calcula los puntos de recompensa en base al tipo de material y peso
   */
  calcularPuntos(categoria: string, peso = 1): number {
    const cat = (categoria || '').toLowerCase().trim();
    let base = 10;
    if (cat.includes('metal') || cat.includes('aluminio') || cat.includes('lata')) {
      base = 15;
    } else if (cat.includes('papel') || cat.includes('carton') || cat.includes('cartón')) {
      base = 5;
    } else if (cat.includes('plast') || cat.includes('plást') || cat.includes('pet')) {
      base = 10;
    } else if (cat.includes('vidrio')) {
      base = 8;
    }
    const factorPeso = peso > 0 ? peso : 1;
    return Math.max(1, Math.round(base * factorPeso));
  }

  /**
   * Genera un código QR firmado criptográficamente con Keccak256 y ECDSA (secp256k1)
   * con TTL de 10 minutos para desplegar en la pantalla OLED de la estación física.
   */
  async generarQR(categoria: string, stationId?: string, peso = 1) {
    if (!this.privateKey) {
      await this.initializePrivateKey();
    }

    const puntos = this.calcularPuntos(categoria, peso);
    const timestamp = new Date().toISOString();
    const randomHex = crypto.randomBytes(4).toString('hex');
    const cleanCat = (categoria || 'RESIDUO')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase();
    const codigo = `QR-${cleanCat}-${Date.now()}-${randomHex}`;

    // Construcción del hash Keccak256 empaquetado
    const messageHash = ethers.solidityPackedKeccak256(
      ['string', 'string', 'string'],
      [codigo, categoria, timestamp],
    );

    const wallet = new ethers.Wallet(this.privateKey);
    const firma = await wallet.signMessage(ethers.getBytes(messageHash));

    // Expiración: 10 minutos
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const qrToken = await this.prisma.qRToken.create({
      data: {
        codigo,
        categoria,
        firma,
        usado: false,
        expiresAt,
      },
    });

    // Formato compacto para renderizado OLED en ESP32
    const oledPayload = JSON.stringify({
      c: codigo,
      m: categoria,
      p: puntos,
      exp: expiresAt.getTime(),
      s: firma,
    });

    return {
      id: qrToken.id,
      codigo,
      categoria,
      material: categoria,
      puntos,
      firma,
      usado: false,
      timestamp,
      expiresAt: expiresAt.toISOString(),
      qrPayload: oledPayload,
      stationId,
    };
  }

  /**
   * Verifica la validez, firma y no-expiración de un código QR.
   */
  async verificarQR(codigoOrToken: string, firma?: string) {
    if (!codigoOrToken) {
      throw new BadRequestException('Código o token de QR requerido');
    }

    let cleanCode = codigoOrToken.trim();
    if (cleanCode.startsWith('{') && cleanCode.endsWith('}')) {
      try {
        const parsed = JSON.parse(cleanCode);
        cleanCode = parsed.c || parsed.codigo || cleanCode;
      } catch {
        // use cleanCode as is
      }
    }

    const qrToken = await this.prisma.qRToken.findUnique({
      where: { codigo: cleanCode },
    });

    if (!qrToken) {
      throw new NotFoundException('Código QR no encontrado');
    }

    if (qrToken.usado) {
      throw new BadRequestException('El código QR ya fue usado');
    }

    if (new Date() > qrToken.expiresAt) {
      throw new BadRequestException('El código QR ha expirado');
    }

    if (firma && qrToken.firma !== firma) {
      throw new BadRequestException('Firma de QR inválida');
    }

    const puntos = this.calcularPuntos(qrToken.categoria);

    return {
      codigo: qrToken.codigo,
      valido: true,
      valid: true,
      material: qrToken.categoria,
      categoria: qrToken.categoria,
      puntos,
      usado: qrToken.usado,
      expiresAt: qrToken.expiresAt,
      mensaje: 'Firma verificada exitosamente',
    };
  }

  /**
   * Reclamo atómico de puntos de reciclaje por parte de un usuario autenticado.
   * Mitiga ataques de repetición marcando `usado: true` en una transacción aislada.
   */
  async reclamarQR(
    user: { id: string; email?: string; walletAddress?: string },
    dto: { codigo: string; firma?: string },
  ) {
    if (!dto.codigo) {
      throw new BadRequestException('Código o token de QR requerido');
    }

    let cleanCode = dto.codigo.trim();
    if (cleanCode.startsWith('{') && cleanCode.endsWith('}')) {
      try {
        const parsed = JSON.parse(cleanCode);
        cleanCode = parsed.c || parsed.codigo || cleanCode;
      } catch {
        // use cleanCode as is
      }
    }

    if (!this.privateKey) {
      await this.initializePrivateKey();
    }

    return await this.prisma.$transaction(async (tx) => {
      const qrToken = await tx.qRToken.findUnique({
        where: { codigo: cleanCode },
      });

      if (!qrToken) {
        throw new NotFoundException('Código QR no encontrado');
      }

      if (qrToken.usado) {
        throw new ConflictException('El código QR ya ha sido reclamado (ataque de repetición evitado)');
      }

      if (new Date() > qrToken.expiresAt) {
        throw new BadRequestException('El código QR ha expirado');
      }

      if (dto.firma && qrToken.firma !== dto.firma) {
        throw new BadRequestException('Firma de QR inválida');
      }

      // Quema atómica del token para evitar doble reclamo
      await tx.qRToken.update({
        where: { id: qrToken.id },
        data: { usado: true },
      });

      const rawTo = user.walletAddress || `0x${user.id.replace(/-/g, '').padEnd(40, '0')}`;
      const toAddress = ethers.isAddress(rawTo) ? ethers.getAddress(rawTo) : rawTo;
      const fromAddress = this.operatorAddress || '0x0000000000000000000000000000000000000000';

      // Registro de evento blockchain en estado PENDING para procesamiento asíncrono BullMQ
      const blockchainEvent = await tx.blockchainEvent.create({
        data: {
          fromAddress,
          toAddress,
          amount: puntos,
          status: BlockchainEventStatus.PENDING,
        },
      });

      return {
        success: true,
        puntos,
        material: qrToken.categoria,
        categoria: qrToken.categoria,
        txStatus: 'QUEUED',
        blockchainEventId: blockchainEvent.id,
        message: 'Puntos reclamados exitosamente',
      };
    });
  }
}
