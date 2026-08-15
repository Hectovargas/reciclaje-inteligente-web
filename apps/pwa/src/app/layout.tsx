import './globals.css';
import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '../context/AuthContext';
import { OfflineBanner } from '../components/OfflineBanner';

export const metadata: Metadata = {
  title: 'CleanCity PWA - Escanea & Gana Tokens RECI',
  description: 'Aplicación PWA móvil para escanear códigos QR de reciclaje inteligente y recibir tokens ERC-20 on-chain.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CleanCity PWA',
  },
};

export const viewport: Viewport = {
  themeColor: '#10b981',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <AuthProvider>
          <OfflineBanner />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
