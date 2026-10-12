import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const TOKEN_KEY = 'resolvex-access-token';

export type AuthUser = { id: number | null; name: string; role: 'customer' | 'admin'; mobile?: string | null };
type LoginResult = { access_token: string; user: AuthUser };
type OtpRequestResult = { challenge_id: string; demo_otp: string; expires_in: number };
type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  requestCustomerOtp: (mobile: string) => Promise<OtpRequestResult>;
  loginCustomer: (mobile: string, otp: string, challengeId: string) => Promise<void>;
  loginAdmin: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const token = getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (response.status === 401) window.dispatchEvent(new Event('resolvex:unauthorized'));
  return response;
}

async function parseLogin(response: Response): Promise<LoginResult> {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.detail || 'Sign in failed');
  return body as LoginResult;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const clearSession = () => { localStorage.removeItem(TOKEN_KEY); setUser(null); };
    window.addEventListener('resolvex:unauthorized', clearSession);
    const token = getAccessToken();
    if (!token) { setLoading(false); return () => window.removeEventListener('resolvex:unauthorized', clearSession); }
    fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async response => {
        if (!response.ok) throw new Error('Session expired');
        setUser(await response.json());
      })
      .catch(() => { localStorage.removeItem(TOKEN_KEY); setUser(null); })
      .finally(() => setLoading(false));
    return () => window.removeEventListener('resolvex:unauthorized', clearSession);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    async requestCustomerOtp(mobile) {
      const response = await fetch(`${API_BASE}/auth/customer/request-otp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mobile }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.detail || 'Could not send OTP');
      return body as OtpRequestResult;
    },
    async loginCustomer(mobile, otp, challengeId) {
      const response = await fetch(`${API_BASE}/auth/customer/verify-otp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mobile, otp, challenge_id: challengeId }),
      });
      const result = await parseLogin(response);
      localStorage.setItem(TOKEN_KEY, result.access_token);
      setUser(result.user);
    },
    async loginAdmin(username, password) {
      const response = await fetch(`${API_BASE}/auth/admin/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }),
      });
      const result = await parseLogin(response);
      localStorage.setItem(TOKEN_KEY, result.access_token);
      setUser(result.user);
    },
    async logout() {
      try { await apiFetch('/auth/logout', { method: 'POST' }); } catch { /* clear local session regardless */ }
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
    },
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
