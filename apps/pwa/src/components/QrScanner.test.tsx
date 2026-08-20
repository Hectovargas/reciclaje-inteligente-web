import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QrScanner } from './QrScanner';

describe('QrScanner Component', () => {
  it('renders default camera view with start button and tab switcher', () => {
    render(<QrScanner onScan={() => {}} />);
    expect(screen.getByText('Cámara')).toBeInTheDocument();
    expect(screen.getByText('Subir QR')).toBeInTheDocument();
    expect(screen.getByText('Activar Cámara')).toBeInTheDocument();
    expect(screen.queryByText('Código Manual')).not.toBeInTheDocument();
  });

  it('switches to file upload tab', () => {
    render(<QrScanner onScan={() => {}} />);

    // Click Subir QR tab
    fireEvent.click(screen.getByText('Subir QR'));

    expect(screen.getByText('Seleccionar foto o captura de QR')).toBeInTheDocument();
  });
});
