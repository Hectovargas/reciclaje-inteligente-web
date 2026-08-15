import { Test, TestingModule } from '@nestjs/testing';
import { BlockchainService } from './blockchain.service';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';

describe('BlockchainService', () => {
  let service: BlockchainService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlockchainService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'SEPOLIA_RPC_URL') return 'http://127.0.0.1:8545';
              if (key === 'CONTRACT_ADDRESS') return '0x5FbDB2315678afecb367f032d93F642f64180aa3';
              if (key === 'ADMIN_PRIVATE_KEY') return '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<BlockchainService>(BlockchainService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('mint', () => {
    it('should validate target address format before minting', async () => {
      await expect(service.mint('invalid-address', 10)).rejects.toThrow(/invalid evm address/i);
    });

    it('should execute minting with valid address and amount', async () => {
      const recipient = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
      const result = await service.mint(recipient, 25.5);

      expect(result).toBeDefined();
      expect(result.txHash).toBeDefined();
      expect(result.txHash.startsWith('0x')).toBe(true);
    });
  });

  describe('mintBatch', () => {
    it('should reject when recipients and amounts array lengths mismatch', async () => {
      const recipients = ['0x70997970C51812dc3A010C7d01b50e0d17dc79C8'];
      const amounts = [10, 20];

      await expect(service.mintBatch(recipients, amounts)).rejects.toThrow(
        /length mismatch/i,
      );
    });

    it('should reject when batch is empty', async () => {
      await expect(service.mintBatch([], [])).rejects.toThrow(
        /cannot mint empty batch/i,
      );
    });

    it('should reject when any recipient address is invalid', async () => {
      const recipients = ['0x70997970C51812dc3A010C7d01b50e0d17dc79C8', 'not-valid'];
      const amounts = [10, 20];

      await expect(service.mintBatch(recipients, amounts)).rejects.toThrow(
        /invalid evm address/i,
      );
    });

    it('should execute mintBatch with valid parameters', async () => {
      const recipients = [
        '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
      ];
      const amounts = [15.0, 30.5];

      const result = await service.mintBatch(recipients, amounts);

      expect(result).toBeDefined();
      expect(result.txHash).toBeDefined();
      expect(result.txHash.startsWith('0x')).toBe(true);
    });
  });

  describe('getBalance', () => {
    it('should reject invalid EVM address', async () => {
      await expect(service.getBalance('invalid-addr')).rejects.toThrow(/invalid evm address/i);
    });

    it('should return formatted balance structure for valid address', async () => {
      const target = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
      const balance = await service.getBalance(target);

      expect(balance).toBeDefined();
      expect(balance.address).toBe(target);
      expect(balance.symbol).toBe('RECI');
      expect(balance.decimals).toBe(18);
      expect(typeof balance.balance).toBe('string');
    });
  });

  describe('getStatus', () => {
    it('should return contract and network status structure', async () => {
      const status = await service.getStatus();

      expect(status).toBeDefined();
      expect(status.contractAddress).toBeDefined();
      expect(status.tokenSymbol).toBe('RECI');
      expect(status.network).toBeDefined();
    });
  });
});
