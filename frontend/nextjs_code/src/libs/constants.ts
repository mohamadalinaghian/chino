
export const SS_API_URL = process.env.NEXT_PUBLIC_SERVER_SIDE_API_URL;

export const CS_API_URL = process.env.NEXT_PUBLIC_CLIENT_SIDE_API_URL;

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
} as const;


export const REVALIDATE = Number(process.env.NEXT_FETCH_REVALIDATE) || 86400;
