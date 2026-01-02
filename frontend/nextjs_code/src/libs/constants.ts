/**
 * Application-wide constants and configuration values.
 * Centralizes environment variables and storage keys.
 */

/**
 * Server-side API URL for Next.js server components and API routes
 */
export const SS_API_URL = process.env.NEXT_PUBLIC_SERVER_SIDE_API_URL;

/**
 * Client-side API URL for browser requests
 */
export const CS_API_URL = process.env.NEXT_PUBLIC_CLIENT_SIDE_API_URL;

/**
 * Local storage keys for authentication tokens
 */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
} as const;

/**
 * Cache revalidation time in seconds (default: 24 hours)
 */
export const REVALIDATE = Number(process.env.NEXT_FETCH_REVALIDATE) || 86400;

/**
 * Public routes that don't require authentication
 * These routes are accessible to everyone, including anonymous users
 */
export const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/menu',
  '/about',
  '/contact',
] as const;

/**
 * Auth routes - redirect to dashboard if already authenticated
 */
export const AUTH_ROUTES = ['/login'] as const;

/**
 * Default redirect after login
 */
export const DEFAULT_AUTH_REDIRECT = '/dashboard';

/**
 * Login page path
 */
export const LOGIN_PATH = '/login';

/**
 * Catppuccin Mocha Color Palette
 * Used for the POS and sale management UI
 */
export const CATPPUCCIN_COLORS = {
  // Base colors
  bgPrimary: '#1E1E2E',    // Base - Main background
  bgSecondary: '#181825',  // Surface0 - Secondary background
  surface: '#313244',      // Surface1 - Card backgrounds

  // Text colors
  text: '#CDD6F4',         // Text - Primary text
  subtext: '#A6ADC8',      // Subtext0 - Secondary text

  // Accent colors
  accent: '#CBA6F7',       // Mauve - Primary accent
  green: '#A6E3A1',        // Green - Success states
  red: '#F38BA8',          // Red - Error/warning states
  blue: '#89B4FA',         // Blue - Info states
  yellow: '#F9E2AF',       // Yellow - Warning states

  // Border
  border: '#313244',       // Same as surface for subtle borders

  // Additional colors
  overlay: '#11111B',      // Crust - Overlays and modals
  pink: '#F5C2E7',         // Pink - Highlights
  peach: '#FAB387',        // Peach - Secondary accents
  teal: '#94E2D5',         // Teal - Info accents
} as const;
