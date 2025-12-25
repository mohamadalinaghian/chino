
import { CS_API_URL } from '@/libs/constants';
import { TokenPair, UserInfo } from '@/types/authType';

export async function loginRequest(
  mobile: string,
  password: string
): Promise<TokenPair> {
  const res = await fetch(`${CS_API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile, password }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || 'Login failed');
  }

  return res.json();
}

export async function refreshTokenRequest(
  refresh: string
): Promise<{ access: string }> {
  const res = await fetch(`${CS_API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) {
    throw new Error('Refresh failed');
  }

  return res.json();
}

export async function meRequest(token: string): Promise<UserInfo> {
  const res = await fetch(`${CS_API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error('Unauthorized');
  }

  return res.json();
}
