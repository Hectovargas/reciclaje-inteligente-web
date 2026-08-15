import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QrScanner } from './QrScanner';

describe('QrScanner Component', () => {
  it('renders default camera view with start button and tab switcher', () => {
    render(<QrScanner onScan={() => {}} />);
    expect(screen.getByText('Cámara')).toBeInTheDocument();
    expect(screen.getByText('Subir QR')).toBeInTheDocument();
    expect(screen.getByText('Manual / Demo')).toBeInTheDocument();
    expect(screen.getByText('Activar Cámara')).toBeInTheDocument();
  });

  it('switches to manual / demo tab and allows code entry', () => {
    const onScan = vi.fn();
    render(<QrScanner onScan={onScan} />);

    // Click Manual tab
    fireEvent.click(screen.getByText('Manual / Demo'));

    expect(screen.getByPlaceholderText('Ej: QR-PLASTICO-1723680000-abcd1234')).toBeInTheDocument();

    // Type manual code and submit
    const input = screen.getByPlaceholderText('Ej: QR-PLASTICO-1723680000-abcd1234');
    fireEvent.change(input, { target: { value: 'QR-TEST-MANUAL-12345' } });
    fireEvent.click(screen.getByText('Verificar y Procesar'));

    expect(onScan).toHaveBeenCalledWith('QR-TEST-MANUAL-12345');
  });

  it('triggers scan on clicking demo preset buttons', () => {
    const onScan = vi.fn();
    render(<QrScanner onScan={onScan} />);

    // Switch to manual mode to see presets
    fireEvent.click(screen.getByText('Manual / Demo'));

    // Click demo plastic preset
    const presetBtn = screen.getByText(/RECI \(Plastico\)/i);
    fireEvent.click(presetBtn);

    expect(onScan).toHaveBeenCalledTimes(1);
    expect(onScan.mock.calls[0][0]).toMatch(/^QR-PLASTICO-/);
  });
});
