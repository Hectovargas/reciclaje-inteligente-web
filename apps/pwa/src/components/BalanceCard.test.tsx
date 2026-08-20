import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BalanceCard } from './BalanceCard';
import { blockchainApi } from '../lib/api';

describe('BalanceCard Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders login prompt when user is not logged in', () => {
    render(<BalanceCard user={null} />);
    expect(screen.getByText('Tu Billetera de Reciclaje')).toBeInTheDocument();
    expect(screen.getByText('Acceder a mi Cuenta')).toBeInTheDocument();
  });

  it('fetches and displays live RECI token balance for authenticated user', async () => {
    vi.spyOn(blockchainApi, 'getBalance').mockResolvedValue({
      address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      balance: '150.0',
      symbol: 'RECI',
    });

    const mockUser = {
      id: 'usr-1',
      name: 'Carlos',
      email: 'carlos@cleancity.io',
      role: 'USER',
      walletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    };

    render(<BalanceCard user={mockUser} />);

    await waitFor(() => {
      expect(screen.getByText('150.0')).toBeInTheDocument();
      expect(screen.getByText('RECI')).toBeInTheDocument();
    });
  });
});
