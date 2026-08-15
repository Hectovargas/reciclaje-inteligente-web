import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ClaimModal } from './ClaimModal';
import { qrApi } from '../lib/api';

describe('ClaimModal Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('verifies QR token and shows reward preview with points and material', async () => {
    vi.spyOn(qrApi, 'verify').mockResolvedValue({
      codigo: 'QR-PLASTICO-999',
      valido: true,
      material: 'Plástico',
      puntos: 10,
      usado: false,
      expiresAt: new Date().toISOString(),
    });

    const mockUser = {
      id: 'usr-1',
      name: 'Carlos',
      email: 'carlos@cleancity.io',
      role: 'USER',
      walletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    };

    render(
      <ClaimModal
        isOpen={true}
        onClose={() => {}}
        scannedCode="QR-PLASTICO-999"
        user={mockUser}
        onClaimSuccess={() => {}}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Recompensa de Reciclaje')).toBeInTheDocument();
      expect(screen.getByText('Plástico')).toBeInTheDocument();
      expect(screen.getByText('+10')).toBeInTheDocument();
      expect(screen.getByText('Reclamar Recompensa')).toBeInTheDocument();
    });
  });

  it('performs atomic claim when clicking Reclamar Recompensa', async () => {
    vi.spyOn(qrApi, 'verify').mockResolvedValue({
      codigo: 'QR-PLASTICO-999',
      valido: true,
      material: 'Plástico',
      puntos: 10,
      usado: false,
      expiresAt: new Date().toISOString(),
    });

    vi.spyOn(qrApi, 'claim').mockResolvedValue({
      success: true,
      puntos: 10,
      material: 'Plástico',
      txStatus: 'QUEUED',
      message: 'Puntos reclamados exitosamente',
    });

    const onClaimSuccess = vi.fn();
    const mockUser = {
      id: 'usr-1',
      name: 'Carlos',
      email: 'carlos@cleancity.io',
      role: 'USER',
      walletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    };

    render(
      <ClaimModal
        isOpen={true}
        onClose={() => {}}
        scannedCode="QR-PLASTICO-999"
        user={mockUser}
        onClaimSuccess={onClaimSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Reclamar Recompensa')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Reclamar Recompensa'));

    await waitFor(() => {
      expect(screen.getByText('¡Reclamo Exitoso!')).toBeInTheDocument();
      expect(screen.getByText('QUEUED')).toBeInTheDocument();
      expect(onClaimSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('shows error message if QR is already used (replay mitigation)', async () => {
    vi.spyOn(qrApi, 'verify').mockRejectedValue(new Error('El código QR ya fue usado'));

    render(
      <ClaimModal
        isOpen={true}
        onClose={() => {}}
        scannedCode="QR-PLASTICO-USED"
        user={null}
        onClaimSuccess={() => {}}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('No se pudo procesar el código')).toBeInTheDocument();
      expect(screen.getByText('El código QR ya fue usado')).toBeInTheDocument();
    });
  });
});
