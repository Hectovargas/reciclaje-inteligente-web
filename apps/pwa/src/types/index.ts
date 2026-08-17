export interface User {
  id?: string;
  email: string;
  name: string;
  role: string;
  accessLevel?: string;
  initials?: string;
  walletAddress?: string;
}

export interface AuthResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  walletAddress?: string;
  user?: User;
  message?: string;
}

export interface QrVerificationResult {
  codigo: string;
  valido: boolean;
  valid?: boolean;
  material: string;
  categoria?: string;
  puntos: number;
  usado: boolean;
  expiresAt: string | Date;
  mensaje?: string;
}

export interface ClaimResult {
  success: boolean;
  puntos: number;
  material: string;
  categoria?: string;
  txStatus: 'QUEUED' | 'CONFIRMED' | 'BATCHED' | 'PENDING' | 'FAILED';
  blockchainEventId?: string;
  message: string;
}

export interface BalanceResponse {
  address: string;
  balance: string;
  symbol: string;
  network?: string;
  contractAddress?: string;
}

export interface BlockchainTransaction {
  id: string;
  txHash?: string | null;
  fromAddress: string;
  toAddress: string;
  amount: number;
  status: 'PENDING' | 'BATCHED' | 'CONFIRMED' | 'FAILED';
  batchId?: string | null;
  blockNumber?: number | null;
  error?: string | null;
  createdAt: string;
  updatedAt: string;
}
