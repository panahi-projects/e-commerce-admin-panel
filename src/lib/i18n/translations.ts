// UI translation catalogs (the API only localizes server messages, not UI chrome — §7).
// Keep keys flat and stable; add per-feature strings in later passes.

export type Locale = 'en' | 'fa';

export const LOCALES: { code: Locale; label: string; dir: 'ltr' | 'rtl' }[] = [
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'fa', label: 'فارسی', dir: 'rtl' },
];

export const dirFor = (locale: Locale): 'ltr' | 'rtl' => (locale === 'fa' ? 'rtl' : 'ltr');

const en = {
  'common.loading': 'Loading…',
  'common.logout': 'Sign out',
  'common.language': 'Language',
  'common.tenant': 'Tenant',
  'common.allTenants': 'All tenants',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.search': 'Search',

  'menu.main': 'Menu',
  'menu.management': 'Management',
  'menu.platform': 'Platform',
  'menu.settings': 'Settings',

  'nav.dashboard': 'Dashboard',
  'nav.orders': 'Orders',
  'nav.products': 'Products',
  'nav.categories': 'Categories',
  'nav.inventory': 'Inventory',
  'nav.customers': 'Customers',
  'nav.coupons': 'Coupons',
  'nav.reviews': 'Reviews',
  'nav.banners': 'Banners',
  'nav.newsletter': 'Newsletter',
  'nav.loyalty': 'Loyalty',
  'nav.notifications': 'Notifications',
  'nav.auditLogs': 'Audit logs',
  'nav.permissions': 'Permissions',
  'nav.tenants': 'Tenants',
  'nav.profile': 'Profile',
} as const;

export type TranslationKey = keyof typeof en;

const fa: Record<TranslationKey, string> = {
  'common.loading': 'در حال بارگذاری…',
  'common.logout': 'خروج',
  'common.language': 'زبان',
  'common.tenant': 'مستأجر',
  'common.allTenants': 'همه مستأجرها',
  'common.save': 'ذخیره',
  'common.cancel': 'انصراف',
  'common.search': 'جستجو',

  'menu.main': 'منو',
  'menu.management': 'مدیریت',
  'menu.platform': 'پلتفرم',
  'menu.settings': 'تنظیمات',

  'nav.dashboard': 'داشبورد',
  'nav.orders': 'سفارش‌ها',
  'nav.products': 'محصولات',
  'nav.categories': 'دسته‌بندی‌ها',
  'nav.inventory': 'موجودی',
  'nav.customers': 'مشتریان',
  'nav.coupons': 'کوپن‌ها',
  'nav.reviews': 'نظرات',
  'nav.banners': 'بنرها',
  'nav.newsletter': 'خبرنامه',
  'nav.loyalty': 'باشگاه مشتریان',
  'nav.notifications': 'اعلان‌ها',
  'nav.auditLogs': 'گزارش رخدادها',
  'nav.permissions': 'دسترسی‌ها',
  'nav.tenants': 'مستأجرها',
  'nav.profile': 'پروفایل',
};

export const translations: Record<Locale, Record<TranslationKey, string>> = { en, fa };
