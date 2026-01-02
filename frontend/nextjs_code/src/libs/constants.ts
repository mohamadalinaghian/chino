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
 * Tokyo Night Color Palette
 * Used for the POS and sale management UI
 */
export const THEME_COLORS = {
  // Base colors
  bgPrimary: '#1a1b26',    // Main background
  bgSecondary: '#16161e',  // Secondary background
  surface: '#24283b',      // Card backgrounds

  // Text colors
  text: '#c0caf5',         // Primary text
  subtext: '#9aa5ce',      // Secondary text
  textDark: '#565f89',     // Darker text

  // Accent colors
  accent: '#7aa2f7',       // Blue - Primary accent
  accentDark: '#3d59a1',   // Dark blue
  green: '#9ece6a',        // Green - Success states
  red: '#f7768e',          // Red - Error/warning states
  orange: '#ff9e64',       // Orange - Warning states
  yellow: '#e0af68',       // Yellow
  purple: '#bb9af7',       // Purple - Highlights
  cyan: '#7dcfff',         // Cyan - Info states
  magenta: '#c678dd',      // Magenta

  // Border
  border: '#414868',       // Border color

  // Additional colors
  overlay: '#16161e',      // Overlays and modals
} as const;

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  // Menu endpoints
  MENU_CATEGORIES: '/menu/categories/',
  MENU_ITEMS: '/menu/items/',
  MENU_SALE: '/menu/sale/menu',
  MENU_ITEM_EXTRAS: (itemId: number) => `/menu/items/${itemId}/extras/`,

  // Sale endpoints
  SALE_OPEN: '/sale/open',
  SALE_DETAILS: (saleId: number) => `/sale/${saleId}`,
  SALE_SYNC: (saleId: number) => `/sale/${saleId}/sync`,
  SALE_CLOSE: (saleId: number) => `/sale/${saleId}/close`,
  SALE_CANCEL: (saleId: number) => `/sale/${saleId}/cancel`,

  // Table endpoints
  TABLES_ALL: '/table/',
  TABLES_EMPTY: '/table/empty/',

  // Auth endpoints
  AUTH_LOGIN: '/auth/login',
  AUTH_REFRESH: '/auth/refresh',
  AUTH_ME: '/auth/me',

  // User endpoints
  USER_LIST: '/user/',
} as const;

/**
 * UI Text Constants (Persian)
 */
export const UI_TEXT = {
  // Sale types
  SALE_TYPE_DINE_IN: 'سرو در محل',
  SALE_TYPE_TAKEAWAY: 'بیرون بر',
  SALE_TYPE_LABEL: 'نوع سفارش',

  // Buttons
  BTN_IMMEDIATE_PAY: 'پرداخت فوری',
  BTN_SAVE_OPEN_SALE: 'ذخیره به عنوان فروش باز',
  BTN_ADD_TO_CART: 'افزودن به سبد خرید',
  BTN_ADD: 'افزودن',
  BTN_SELECT_EXTRAS: 'انتخاب افزودنی',
  BTN_RETRY: 'تلاش مجدد',
  BTN_PROCEED_PAYMENT: 'ادامه به پرداخت',

  // Labels
  LABEL_TABLE_SELECT: 'انتخاب میز',
  LABEL_CATEGORIES: 'دسته‌بندی‌ها',
  LABEL_CART: 'سبد خرید',
  LABEL_QUANTITY: 'تعداد',
  LABEL_SUBTOTAL: 'جمع جزء:',
  LABEL_DISCOUNT: 'تخفیف:',
  LABEL_TAX: 'مالیات:',
  LABEL_TOTAL: 'جمع کل:',
  LABEL_EXTRAS: 'افزودنی',
  LABEL_AVAILABLE_EXTRAS: 'افزودنی‌های موجود:',

  // Messages
  MSG_LOADING_MENU: 'در حال بارگذاری منو...',
  MSG_LOADING_TABLES: 'در حال بارگذاری میزها...',
  MSG_LOADING_EXTRAS: 'در حال بارگذاری افزودنی‌ها...',
  MSG_CREATING_SALE: 'در حال ایجاد فروش...',
  MSG_EMPTY_CART: 'سبد خرید خالی است',
  MSG_SELECT_FROM_MENU: 'موارد مورد نظر را از منو انتخاب کنید',
  MSG_NO_CATEGORY_ITEMS: 'موردی در این دسته‌بندی یافت نشد',
  MSG_SELECT_CATEGORY: 'لطفاً یک دسته‌بندی را انتخاب کنید',
  MSG_NO_TABLES: 'هیچ میز خالی موجود نیست',
  MSG_NO_EXTRAS: 'افزودنی موجود نیست',

  // Validation messages
  VALIDATION_SELECT_TABLE: 'لطفاً یک میز را انتخاب کنید',
  VALIDATION_EMPTY_CART: 'سبد خرید خالی است',

  // Success messages
  SUCCESS_SALE_CREATED: 'فروش با موفقیت ایجاد شد',
  SUCCESS_OPEN_SALE_SAVED: 'فروش باز با موفقیت ذخیره شد',

  // Error messages
  ERROR_LOADING_MENU: 'خطا در دریافت منوی فروش',
  ERROR_LOADING_TABLES: 'خطا در دریافت لیست میزها',
  ERROR_LOADING_EXTRAS: 'خطا در بارگذاری افزودنی‌ها',
  ERROR_CREATING_SALE: 'خطا در ایجاد فروش',

  // Tabs
  TAB_FOOD: '🍽️ غذا',
  TAB_DRINKS: '🍹 نوشیدنی',

  // Other
  ITEMS_COUNT: (count: number) => `${count} مورد`,
  CAPACITY: (capacity: number) => `${capacity} نفر`,
  PAGE_TITLE: 'فروش جدید',
} as const;
