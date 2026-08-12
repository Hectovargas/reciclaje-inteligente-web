import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ethers } from 'ethers';

const ERC20_ABI = [
  'function mintPoints(address usuario, uint256 cantidad) external',
  'function balanceOf(address account) external view returns (uint256)',
  'function symbol() external view returns (string)',
];

@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainService.name);
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contractAddress: string;

  constructor() {
    const rpcUrl = process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org';
    this.contractAddress = process.env.CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
  }

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

      this.wallet = new ethers.Wallet(privateKey, this.provider);
      this.logger.log('Wallet successfully initialized securely from Vault.');
    } catch (error) {
      this.logger.error('Error initializing BlockchainService with Vault:', error);
      // No re-throwing to avoid hard crash during dev, but typically we would fail fast
    }
  }

  async mintearPuntos(usuarioAddress: string, cantidad: number) {
    this.logger.log(`Solicitud de minting ${cantidad} puntos para ${usuarioAddress}`);
    
    // Scaffolding placeholder logic for ethers contract interaction
    return {
      success: true,
      transactionHash: '0xmocktxhash1234567890abcdef1234567890abcdef1234567890abcdef12345678',
      usuario: usuarioAddress,
      cantidad,
      red: 'Sepolia Testnet',
    };
  }

  async obtenerBalance(usuarioAddress: string) {
    return {
      usuario: usuarioAddress,
      balance: '150.0',
      simbolo: 'RECI',
    };
  }
}
