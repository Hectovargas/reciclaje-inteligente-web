import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { authApi } from '../lib/api';

function TestConsumer() {
  const { user, loading, login, logout } = useAuth();
  if (loading) return <div>Cargando auth...</div>;
  return (
    <div>
      <div data-testid="user-name">{user ? user.name : 'Invitado'}</div>
      <div data-testid="wallet">{user?.walletAddress || 'Sin wallet'}</div>
      <button onClick={() => login('carlos@cleancity.io', 'password123')}>Login</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
}

describe('AuthContext Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('loads current user on initial mount from GET /api/v1/auth/me', async () => {
    vi.spyOn(authApi, 'getMe').mockResolvedValue({
      id: 'usr-1',
      name: 'Carlos Silva',
      email: 'carlos@cleancity.io',
      role: 'USER',
      walletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-name')).toHaveTextContent('Carlos Silva');
      expect(screen.getByTestId('wallet')).toHaveTextContent('0x70997970C51812dc3A010C7d01b50e0d17dc79C8');
    });
  });

  it('handles unauthenticated visitor on initial mount', async () => {
    vi.spyOn(authApi, 'getMe').mockRejectedValue(new Error('Unauthorized'));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-name')).toHaveTextContent('Invitado');
    });
  });

  it('updates state when login and logout are called', async () => {
    vi.spyOn(authApi, 'getMe').mockRejectedValue(new Error('Unauthorized'));
    vi.spyOn(authApi, 'login').mockResolvedValue({
      id: 'usr-2',
      name: 'Elena Rojas',
      email: 'elena@cleancity.io',
      role: 'USER',
      walletAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
      user: {
        id: 'usr-2',
        name: 'Elena Rojas',
        email: 'elena@cleancity.io',
        role: 'USER',
        walletAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
      },
    });
    vi.spyOn(authApi, 'logout').mockResolvedValue({ message: 'Logged out' });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-name')).toHaveTextContent('Invitado');
    });

    // Perform login
    await act(async () => {
      screen.getByText('Login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user-name')).toHaveTextContent('Elena Rojas');
      expect(screen.getByTestId('wallet')).toHaveTextContent('0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC');
    });

    // Perform logout
    await act(async () => {
      screen.getByText('Logout').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user-name')).toHaveTextContent('Invitado');
    });
  });
});
