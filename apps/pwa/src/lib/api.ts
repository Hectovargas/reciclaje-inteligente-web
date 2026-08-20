import {
  AuthResponse,
  BalanceResponse,
  BlockchainTransaction,
  ClaimResult,
  QrVerificationResult,
  User,
} from '../types';

export function resolveApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    let publicEnv = process.env.NEXT_PUBLIC_API_URL;
    if (publicEnv) {
      publicEnv = publicEnv.trim().replace(/\/$/, '');
      if (!publicEnv.startsWith('http://') && !publicEnv.startsWith('https://')) {
        publicEnv = `https://${publicEnv}`;
      }
      if (!publicEnv.includes('://backend') && !publicEnv.startsWith('backend')) {
        return publicEnv;
      }
    }
    // Dynamic fallback to the browser's current host on port 3000 (standard backend port)
    const protocol = window.location.protocol || 'http:';
    const hostname = window.location.hostname || 'localhost';
    return `${protocol}//${hostname}:3000`;
  }

  // Server-side execution (Node / SSR)
  let serverEnv = (
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://backend:3000'
  ).trim().replace(/\/$/, '');

  if (serverEnv && !serverEnv.startsWith('http://') && !serverEnv.startsWith('https://')) {
    serverEnv = `https://${serverEnv}`;
  }

  return serverEnv;
}

export const API_BASE_URL = resolveApiBaseUrl();

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = typeof window !== 'undefined' ? resolveApiBaseUrl() : API_BASE_URL;
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Ensures httpOnly auth cookies are sent and received
  });

  let responseData: any = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      responseData = await response.json();
    } catch {
      responseData = null;
    }
  } else {
    try {
      responseData = await response.text();
    } catch {
      responseData = null;
    }
  }

  if (!response.ok) {
    const errorMessage =
      (responseData && typeof responseData === 'object' && (responseData.message || responseData.error)) ||
      `Error HTTP ${response.status}: ${response.statusText}`;
    
    // Array of validation errors from class-validator
    const finalMsg = Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage;
    throw new ApiError(finalMsg, response.status, responseData);
  }

  return responseData as T;
}

export const authApi = {
  async register(data: { email: string; password: string; name: string }): Promise<AuthResponse> {
    return apiRequest<AuthResponse>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    return apiRequest<AuthResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async logout(): Promise<{ message: string }> {
    return apiRequest<{ message: string }>('/api/v1/auth/logout', {
      method: 'POST',
    });
  },

  async getMe(): Promise<User> {
    const res = await apiRequest<any>('/api/v1/auth/me', {
      method: 'GET',
    });
    return (res.user || res) as User;
  },
};

export const qrApi = {
  async verify(tokenOrCode: string): Promise<QrVerificationResult> {
    const encoded = encodeURIComponent(tokenOrCode.trim());
    try {
      return await apiRequest<QrVerificationResult>(`/api/v1/qr/verificar/${encoded}`, {
        method: 'GET',
      });
    } catch (err: any) {
      // Fallback query parameter variant if path param not matched
      if (err.status === 404) {
        return await apiRequest<QrVerificationResult>(`/api/v1/qr/verificar?codigo=${encoded}`, {
          method: 'GET',
        });
      }
      throw err;
    }
  },

  async claim(codigo: string, firma?: string): Promise<ClaimResult> {
    return apiRequest<ClaimResult>('/api/v1/qr/reclamar', {
      method: 'POST',
      body: JSON.stringify({
        codigo: codigo.trim(),
        firma: firma || undefined,
      }),
    });
  },
};

export const blockchainApi = {
  async getBalance(address: string): Promise<BalanceResponse> {
    return apiRequest<BalanceResponse>(`/api/v1/blockchain/balance/${address}`, {
      method: 'GET',
    });
  },

  async getTransactions(address: string): Promise<BlockchainTransaction[]> {
    return apiRequest<BlockchainTransaction[]>(`/api/v1/blockchain/transactions/${address}`, {
      method: 'GET',
    });
  },

  async getStatus(): Promise<any> {
    return apiRequest<any>('/api/v1/blockchain/status', {
      method: 'GET',
    });
  },
};
