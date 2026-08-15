import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { TransactionHistory } from './TransactionHistory';
import { blockchainApi } from '../lib/api';
import { BlockchainTransaction } from '../types';

describe('TransactionHistory Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders null when user is not logged in', () => {
    const { container } = render(<TransactionHistory user={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders empty state when user has no transactions', async () => {
    vi.spyOn(blockchainApi, 'getTransactions').mockResolvedValue([]);

    const mockUser = {
      id: 'usr-1',
      name: 'Carlos',
      email: 'carlos@cleancity.io',
      role: 'USER',
      walletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    };

    render(<TransactionHistory user={mockUser} />);

    await waitFor(() => {
      expect(screen.getByText('Aún no tienes recompensas registradas.')).toBeInTheDocument();
    });
  });

  it('renders list of transactions with statuses CONFIRMED, BATCHED, and PENDING', async () => {
    const mockTxList: BlockchainTransaction[] = [
      {
        id: 'tx-1',
        fromAddress: '0x0000000000000000000000000000000000000000',
        toAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        amount: 15,
        status: 'CONFIRMED',
        txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        createdAt: '2026-08-15T06:00:00Z',
        updatedAt: '2026-08-15T06:00:10Z',
      },
      {
        id: 'tx-2',
        fromAddress: '0x0000000000000000000000000000000000000000',
        toAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        amount: 10,
        status: 'BATCHED',
        createdAt: '2026-08-15T06:10:00Z',
        updatedAt: '2026-08-15T06:10:00Z',
      },
      {
        id: 'tx-3',
        fromAddress: '0x0000000000000000000000000000000000000000',
        toAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        amount: 5,
        status: 'PENDING',
        createdAt: '2026-08-15T06:20:00Z',
        updatedAt: '2026-08-15T06:20:00Z',
      },
    ];

    vi.spyOn(blockchainApi, 'getTransactions').mockResolvedValue(mockTxList);

    const mockUser = {
      id: 'usr-1',
      name: 'Carlos',
      email: 'carlos@cleancity.io',
      role: 'USER',
      walletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    };

    render(<TransactionHistory user={mockUser} />);

    await waitFor(() => {
      expect(screen.getByText('+15')).toBeInTheDocument();
      expect(screen.getByText('CONFIRMADO')).toBeInTheDocument();
      expect(screen.getByText('+10')).toBeInTheDocument();
      expect(screen.getByText('EN LOTE')).toBeInTheDocument();
      expect(screen.getByText('+5')).toBeInTheDocument();
      expect(screen.getByText('EN COLA')).toBeInTheDocument();
    });
  });
});
