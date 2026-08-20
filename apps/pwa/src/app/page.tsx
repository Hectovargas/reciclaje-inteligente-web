'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Recycle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (user.role === 'ADMIN') {
        router.replace('/admin');
      } else {
        router.replace('/app');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="auth-wrapper">
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, #10b981, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#070b14',
            boxShadow: '0 0 30px rgba(16, 185, 129, 0.45)',
            animation: 'pulseGlow 2s infinite ease-in-out',
          }}
        >
          <Recycle size={36} strokeWidth={2.4} />
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.02em', margin: 0 }}>
          CleanCity <span style={{ color: '#10b981' }}>Reciclaje</span>
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>
          <span style={{ width: 14, height: 14, border: '2px solid #10b981', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
          <span>Iniciando CleanCity...</span>
        </div>
      </div>
    </div>
  );
}
