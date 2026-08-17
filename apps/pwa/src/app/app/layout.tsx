import './pwa.css';
import React from 'react';

export default function PwaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="pwa-wrapper">
      {children}
    </div>
  );
}
