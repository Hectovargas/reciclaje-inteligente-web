'use client';

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { BalanceCard } from '../components/BalanceCard';
import { QrScanner } from '../components/QrScanner';
import { ClaimModal } from '../components/ClaimModal';
import { TransactionHistory } from '../components/TransactionHistory';

export default function Home() {
  const { user } = useAuth();
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleScan = (decodedText: string) => {
    setScannedCode(decodedText);
    setClaimModalOpen(true);
  };

  const handleClaimSuccess = () => {
    // Increment trigger to refresh balance and transaction history
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="pwa-container">
      <Header />

      <main className="main-content">
        {/* Live Custodial RECI Token Balance */}
        <BalanceCard user={user} refreshTrigger={refreshTrigger} />

        {/* Real Camera QR Scanner Component */}
        <QrScanner onScan={handleScan} />

        {/* Transaction History */}
        <TransactionHistory user={user} refreshTrigger={refreshTrigger} />
      </main>

      {/* Claim & Verification Modal */}
      <ClaimModal
        isOpen={claimModalOpen}
        onClose={() => setClaimModalOpen(false)}
        scannedCode={scannedCode}
        user={user}
        onClaimSuccess={handleClaimSuccess}
      />
    </div>
  );
}
