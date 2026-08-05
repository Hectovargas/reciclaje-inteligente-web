import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reciclaje PWA - Escanea & Gana Tokens',
  description: 'Aplicación PWA para canjear QR y recibir tokens de reciclaje',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
