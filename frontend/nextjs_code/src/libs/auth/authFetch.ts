
import { tokenStorage } from './tokenStorage';
import { refreshTokenRequest } from '@/libs/auth/authApi';

export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  let accessToken = tokenStorage.getAccessToken();

  let response = await fetchWithToken(url, accessToken, options);

  if (response.status === 401) {
    const refresh = tokenStorage.getRefreshToken();
    if (!refresh) throw new Error('No refresh token');

    try {
      const data = await refreshTokenRequest(refresh);
      tokenStorage.setAccessToken(data.access);

      response = await fetchWithToken(url, data.access, options);
    } catch {
      tokenStorage.clear();
      throw new Error('Authentication expired');
    }
  }

  return response;
}

async function fetchWithToken(
  url: string,
  token: string | null,
  options: RequestInit
): Promise<Response> {
  const headers = new Headers(options.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(url, { ...options, headers });
}
