import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { RECOMPENSAS_RECICLAJE_ABI } from './recompensas-reciclaje.abi';

export interface MintResult {
  txHash: string;
  blockNumber?: number;
  batchId?: number;
}

export interface BalanceResult {
  address: string;
  balance: string;
  symbol: string;
  decimals: number;
  rawBalance: string;
  isLive: boolean;
}

export interface ContractStatusResult {
  contractAddress: string;
  tokenName: string;
  tokenSymbol: string;
  network: string;
  chainId: number;
  isConnected: boolean;
  isPaused: boolean;
  currentBatchId: number;
}

@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainService.name);
  private provider: ethers.JsonRpcProvider | null = null;
  private wallet: ethers.Wallet | null = null;
  private contract: ethers.Contract | null = null;
  private contractAddress: string;
  private networkName = 'Sepolia Testnet';
  private chainId = 11155111;

  constructor(private readonly configService?: ConfigService) {
    const rpcUrl =
      this.configService?.get<string>('SEPOLIA_RPC_URL') ||
      process.env.SEPOLIA_RPC_URL ||
      'https://rpc.sepolia.org';

    this.contractAddress =
      this.configService?.get<string>('CONTRACT_ADDRESS') ||
      process.env.CONTRACT_ADDRESS ||
      '0x5FbDB2315678afecb367f032d93F642f64180aa3';

    try {
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
    } catch (error) {
      this.logger.warn(`Could not initialize JsonRpcProvider for ${rpcUrl}: ${(error as Error).message}`);
    }
  }

  async onModuleInit() {
    await this.initOperatorWallet();
  }

  /**
   * Initializes the operator wallet from HashiCorp Vault or secure fallback environment variables.
   */
  async initOperatorWallet(): Promise<void> {
    const vaultAddr =
      this.configService?.get<string>('VAULT_ADDR') ||
      process.env.VAULT_ADDR ||
      'http://127.0.0.1:8200';
    const vaultToken =
      this.configService?.get<string>('VAULT_TOKEN') ||
      process.env.VAULT_TOKEN ||
      'root';

    let privateKey: string | null = null;

    // 1. Attempt reading operator private key from HashiCorp Vault
    try {
      this.logger.log(`Fetching operator private key from Vault at ${vaultAddr}`);
      const response = await fetch(`${vaultAddr}/v1/secret/data/reciclaje`, {
        headers: {
          'X-Vault-Token': vaultToken,
        },
      });

      if (response.ok) {
        const data = await response.json();
        privateKey =
          data?.data?.data?.admin_private_key ||
          data?.data?.data?.operator_private_key ||
          null;
      }
    } catch (vaultError) {
      this.logger.debug(`Vault not accessible or error: ${(vaultError as Error).message}`);
    }

    // 2. Fallback to environment variables if Vault is unavailable
    if (!privateKey) {
      privateKey =
        this.configService?.get<string>('ADMIN_PRIVATE_KEY') ||
        process.env.ADMIN_PRIVATE_KEY ||
        this.configService?.get<string>('OPERATOR_PRIVATE_KEY') ||
        process.env.OPERATOR_PRIVATE_KEY ||
        // Standard Hardhat default testing account #0
        '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    }

    if (privateKey) {
      try {
        if (this.provider) {
          this.wallet = new ethers.Wallet(privateKey, this.provider);
          this.contract = new ethers.Contract(
            this.contractAddress,
            RECOMPENSAS_RECICLAJE_ABI,
            this.wallet,
          );
          this.logger.log(
            `Operator wallet initialized: ${this.wallet.address} for contract ${this.contractAddress}`,
          );
        }
      } catch (error) {
        this.logger.error(`Error initializing contract/wallet: ${(error as Error).message}`);
      }
    }
  }

  /**
   * Mints reward tokens to a single recipient.
   */
  async mint(to: string, amount: number | bigint | string): Promise<MintResult> {
    if (!ethers.isAddress(to)) {
      throw new Error(`Invalid EVM address: ${to}`);
    }

    const amountWei =
      typeof amount === 'bigint'
        ? amount
        : ethers.parseUnits(amount.toString(), 18);

    if (this.contract && this.wallet) {
      try {
        this.logger.log(`Executing on-chain mint: ${amount} RECI to ${to}`);
        const tx = await this.contract.mint(to, amountWei);
        const receipt = await tx.wait(1);

        return {
          txHash: tx.hash,
          blockNumber: receipt?.blockNumber,
        };
      } catch (error) {
        this.logger.error(`On-chain mint failed: ${(error as Error).message}`);
        throw error;
      }
    }

    // Demo / offline fallback simulation
    const simulatedTxHash = `0x${ethers.hexlify(ethers.randomBytes(32)).substring(2)}`;
    this.logger.warn(`Contract not connected to live RPC. Simulated mint tx: ${simulatedTxHash}`);
    return {
      txHash: simulatedTxHash,
      blockNumber: 1,
    };
  }

  /**
   * Mints multiple rewards in a single batched smart contract call.
   */
  async mintBatch(
    recipients: string[],
    amounts: (number | bigint | string)[],
  ): Promise<MintResult> {
    if (recipients.length !== amounts.length) {
      throw new Error('Recipients and amounts array length mismatch');
    }
    if (recipients.length === 0) {
      throw new Error('Cannot mint empty batch');
    }

    for (let i = 0; i < recipients.length; i++) {
      if (!ethers.isAddress(recipients[i])) {
        throw new Error(`Invalid EVM address at index ${i}: ${recipients[i]}`);
      }
    }

    const amountsWei = amounts.map((a) =>
      typeof a === 'bigint' ? a : ethers.parseUnits(a.toString(), 18),
    );

    if (this.contract && this.wallet) {
      try {
        this.logger.log(
          `Executing on-chain mintBatch for ${recipients.length} recipients...`,
        );
        const tx = await this.contract.mintBatch(recipients, amountsWei);
        const receipt = await tx.wait(1);

        // Attempt to extract batchId from event logs
        let parsedBatchId: number | undefined;
        if (receipt && receipt.logs) {
          for (const log of receipt.logs) {
            try {
              const parsed = this.contract.interface.parseLog(log);
              if (parsed && parsed.name === 'BatchMintExecuted') {
                parsedBatchId = Number(parsed.args.batchId);
                break;
              }
            } catch {
              // Not our event, continue
            }
          }
        }

        return {
          txHash: tx.hash,
          batchId: parsedBatchId,
          blockNumber: receipt?.blockNumber,
        };
      } catch (error) {
        this.logger.error(`On-chain mintBatch failed: ${(error as Error).message}`);
        throw error;
      }
    }

    // Demo / offline fallback simulation
    const simulatedTxHash = `0x${ethers.hexlify(ethers.randomBytes(32)).substring(2)}`;
    const simulatedBatchId = Date.now() % 10000;
    this.logger.warn(
      `Contract not connected to live RPC. Simulated mintBatch tx: ${simulatedTxHash}`,
    );
    return {
      txHash: simulatedTxHash,
      batchId: simulatedBatchId,
      blockNumber: 1,
    };
  }

  /**
   * Retrieves the ERC-20 token balance for a given address.
   */
  async getBalance(address: string): Promise<BalanceResult> {
    if (!ethers.isAddress(address)) {
      throw new Error(`Invalid EVM address: ${address}`);
    }

    if (this.contract) {
      try {
        const rawBalance: bigint = await this.contract.balanceOf(address);
        let symbol = 'RECI';
        try {
          symbol = await this.contract.symbol();
        } catch {
          // fallback symbol
        }
        const formatted = ethers.formatUnits(rawBalance, 18);

        return {
          address,
          balance: formatted,
          symbol,
          decimals: 18,
          rawBalance: rawBalance.toString(),
          isLive: true,
        };
      } catch (error) {
        this.logger.warn(`Could not read balance from RPC: ${(error as Error).message}`);
      }
    }

    return {
      address,
      balance: '0.0',
      symbol: 'RECI',
      decimals: 18,
      rawBalance: '0',
      isLive: false,
    };
  }

  /**
   * Retrieves full blockchain contract and network status.
   */
  async getStatus(): Promise<ContractStatusResult> {
    let isConnected = false;
    let isPaused = false;
    let currentBatchId = 0;
    let tokenName = 'CleanCity Reciclaje';
    let tokenSymbol = 'RECI';

    if (this.contract && this.provider) {
      try {
        const network = await this.provider.getNetwork();
        this.chainId = Number(network.chainId);
        this.networkName =
          this.chainId === 11155111
            ? 'Sepolia Testnet'
            : this.chainId === 31337
              ? 'Hardhat Localhost'
              : `Chain ID ${this.chainId}`;

        tokenName = await this.contract.name();
        tokenSymbol = await this.contract.symbol();
        isPaused = await this.contract.paused();
        const batchIdBn: bigint = await this.contract.currentBatchId();
        currentBatchId = Number(batchIdBn);
        isConnected = true;
      } catch (error) {
        this.logger.warn(`Failed reading contract status from RPC: ${(error as Error).message}`);
      }
    }

    return {
      contractAddress: this.contractAddress,
      tokenName,
      tokenSymbol,
      network: this.networkName,
      chainId: this.chainId,
      isConnected,
      isPaused,
      currentBatchId,
    };
  }

  getContract(): ethers.Contract | null {
    return this.contract;
  }

  getWallet(): ethers.Wallet | null {
    return this.wallet;
  }

  getProvider(): ethers.JsonRpcProvider | null {
    return this.provider;
  }
}
