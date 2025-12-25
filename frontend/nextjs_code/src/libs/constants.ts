
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://backend:8000/api';

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
} as const;


export const REVALIDATE = Number(process.env.NEXT_FETCH_REVALIDATE) || 86400;
