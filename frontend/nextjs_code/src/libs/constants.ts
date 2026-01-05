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
 * Modern Dark Theme (GitHub Dark inspired)
 * Professional dark theme for POS and sale management UI
 */
export const THEME_COLORS = {
  // Base colors
  bgPrimary: '#0d1117',      // Main background - deep dark
  bgSecondary: '#161b22',    // Secondary background - slightly lighter
  surface: '#21262d',        // Card backgrounds - elevated surface

  // Text colors
  text: '#e6edf3',           // Primary text - bright white
  subtext: '#8b949e',        // Secondary text - muted gray
  textDark: '#6e7681',       // Darker text - subtle

  // Accent colors
  accent: '#58a6ff',         // Blue - Primary accent (GitHub blue)
  accentDark: '#1f6feb',     // Dark blue - hover state
  green: '#3fb950',          // Green - Success states
  red: '#f85149',            // Red - Error/warning states
  orange: '#d29922',         // Orange - Warning states
  yellow: '#f0ce4e',         // Yellow - highlights
  purple: '#a371f7',         // Purple - special highlights
  cyan: '#76e3ea',           // Cyan - Info states
  magenta: '#bc8cff',        // Magenta - decorative

  // Border
  border: '#30363d',         // Border color - subtle

  // Additional colors
  overlay: '#0d1117e6',      // Overlays and modals - semi-transparent
  hover: '#30363d',          // Hover state background
} as const;

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  // Menu endpoints
  MENU_CATEGORIES: '/menu/categories/',
  MENU_ITEMS: '/menu/items/',
  MENU_SALE: '/menu/sale/menu',
  MENU_EXTRAS: '/menu/sale/extras',

  // Sale endpoints
  SALE_DASHBOARD: '/sale/',
  SALE_OPEN: '/sale/open',
  SALE_DETAILS: (saleId: number) => `/sale/${saleId}`,
  SALE_SYNC: (saleId: number) => `/sale/${saleId}/sync`,
  SALE_CLOSE: (saleId: number) => `/sale/${saleId}/close`,
  SALE_CANCEL: (saleId: number) => `/sale/${saleId}/cancel`,
  SALE_ADD_PAYMENT: (saleId: number) => `/sale/${saleId}/payment`,

  // Table endpoints
  TABLES_ALL: '/table/',
  TABLES_EMPTY: '/table/empty/',

  // Auth endpoints
  AUTH_LOGIN: '/auth/login',
  AUTH_REFRESH: '/auth/refresh',
  AUTH_ME: '/auth/me',

  // User endpoints
  USER_LIST: '/user/',
  BANK_ACCOUNTS: '/user/bank-accounts/',
  POS_ACCOUNT: '/user/pos-account/',
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

  // Payment
  PAYMENT_METHOD_CASH: 'نقدی',
  PAYMENT_METHOD_POS: 'کارتخوان',
  PAYMENT_METHOD_CARD_TRANSFER: 'کارت به کارت',
  LABEL_PAYMENT_METHOD: 'روش پرداخت',
  LABEL_AMOUNT: 'مبلغ',
  LABEL_TIP: 'انعام',
  LABEL_SELECT_ACCOUNT: 'انتخاب حساب مقصد',
  LABEL_SELECT_ITEMS: 'انتخاب اقلام',
  LABEL_ALL_ITEMS: 'همه اقلام',
  LABEL_SELECTED_ITEMS: 'اقلام انتخاب شده',
  LABEL_TAX_DISCOUNT: 'مالیات و تخفیف',
  LABEL_TAX_TYPE: 'نوع مالیات',
  LABEL_DISCOUNT_TYPE: 'نوع تخفیف',
  LABEL_FIXED_AMOUNT: 'مبلغ ثابت',
  LABEL_PERCENTAGE: 'درصد',
  LABEL_PAYMENT_HISTORY: 'تاریخچه پرداخت‌ها',
  LABEL_TOTAL_PAID: 'مجموع پرداخت شده',
  LABEL_REMAINING: 'مانده',
  BTN_ADD_PAYMENT: 'افزودن پرداخت',
  BTN_SUBMIT_PAYMENT: 'ثبت پرداخت',
  BTN_ADD_ANOTHER_PAYMENT: 'افزودن پرداخت دیگر',
  MSG_PAYMENT_SUCCESS: 'پرداخت با موفقیت ثبت شد',
  MSG_SALE_AUTO_CLOSED: 'فروش به صورت خودکار بسته شد',
  ERROR_ADDING_PAYMENT: 'خطا در افزودن پرداخت',
  ERROR_LOADING_BANK_ACCOUNTS: 'خطا در بارگذاری حساب‌های بانکی',
  VALIDATION_SELECT_PAYMENT_METHOD: 'لطفاً روش پرداخت را انتخاب کنید',
  VALIDATION_ENTER_AMOUNT: 'لطفاً مبلغ را وارد کنید',
  VALIDATION_SELECT_ACCOUNT: 'لطفاً حساب مقصد را انتخاب کنید',
  VALIDATION_AMOUNT_GREATER_THAN_ZERO: 'مبلغ باید بیشتر از صفر باشد',

  // Other
  ITEMS_COUNT: (count: number) => `${count} مورد`,
  CAPACITY: (capacity: number) => `${capacity} نفر`,
  PAGE_TITLE: 'فروش جدید',
  PAYMENT_PAGE_TITLE: 'پرداخت فروش',
} as const;
