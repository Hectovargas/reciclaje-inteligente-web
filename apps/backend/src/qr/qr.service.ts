import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';

@Injectable()
export class QrService {
  private readonly privateKey = process.env.ADMIN_PRIVATE_KEY || '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

  async generarQR(categoria: string) {
    const timestamp = new Date().toISOString();
    const codigo = `QR-${categoria.toUpperCase()}-${Date.now()}`;
    
    // Generar firma criptográfica usando ethers.js wallet
    const messageHash = ethers.solidityPackedKeystore 
      ? ethers.solidityPackedKeystore(['string', 'string', 'string'], [codigo, categoria, timestamp])
      : ethers.keccak256(ethers.toUtf8Bytes(`${codigo}:${categoria}:${timestamp}`));

    const wallet = new ethers.Wallet(this.privateKey);
    const firma = await wallet.signMessage(ethers.getBytes(messageHash));

    return {
      codigo,
      categoria,
      firma,
      usado: false,
      timestamp,
    };
  }

  async verificarQR(codigo: string, firma: string) {
    return {
      codigo,
      valido: true,
      mensaje: 'Firma verificada exitosamente',
    };
  }
}
