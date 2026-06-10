import type { ComponentType, SVGProps } from 'react';
import {
  GridIcon,
  ListIcon,
  BoxCubeIcon,
  FolderIcon,
  BoxIconLine,
  GroupIcon,
  DollarLineIcon,
  ShootingStarIcon,
  PaperPlaneIcon,
  MailIcon,
  TableIcon,
  PieChartIcon,
  PlugInIcon,
  LockIcon,
  UserCircleIcon,
} from '@/icons';
import type { TranslationKey } from '@/lib/i18n';
import type { PluginKey } from '@/lib/plugins/types';

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

/** A nav/route section. The registry is the single source of truth for the
 *  sidebar and for which placeholder routes exist (§10/§11). */
export interface SectionDef {
  id: string;
  path: string;
  /** i18n key for the nav label. */
  labelKey: TranslationKey;
  icon: IconType;
  /** Which menu group it appears under. */
  group: 'main' | 'management' | 'platform' | 'settings';
  /** Permission-map section key (§5.7). Omit for always-available self-service. */
  permissionKey?: string;
  /** Plugin gate (§9). Item hidden when the plugin is disabled for the tenant. */
  pluginKey?: PluginKey;
  /** super_admin only (e.g. tenants). */
  superOnly?: boolean;
  /** Always show regardless of permission map (e.g. own profile). */
  alwaysShow?: boolean;
}

export const SECTIONS: SectionDef[] = [
  // Main
  { id: 'dashboard', path: '/', labelKey: 'nav.dashboard', icon: GridIcon, group: 'main', permissionKey: 'analytics', pluginKey: 'analytics' },

  // Management
  { id: 'orders', path: '/orders', labelKey: 'nav.orders', icon: ListIcon, group: 'management', permissionKey: 'orders' },
  { id: 'products', path: '/products', labelKey: 'nav.products', icon: BoxCubeIcon, group: 'management', permissionKey: 'products' },
  { id: 'categories', path: '/categories', labelKey: 'nav.categories', icon: FolderIcon, group: 'management', permissionKey: 'categories' },
  { id: 'inventory', path: '/inventory', labelKey: 'nav.inventory', icon: BoxIconLine, group: 'management', permissionKey: 'inventory' },
  { id: 'customers', path: '/customers', labelKey: 'nav.customers', icon: GroupIcon, group: 'management', permissionKey: 'users' },
  { id: 'coupons', path: '/coupons', labelKey: 'nav.coupons', icon: DollarLineIcon, group: 'management', permissionKey: 'coupons', pluginKey: 'coupons' },
  { id: 'reviews', path: '/reviews', labelKey: 'nav.reviews', icon: ShootingStarIcon, group: 'management', permissionKey: 'reviews', pluginKey: 'reviews' },
  { id: 'banners', path: '/marketing/banners', labelKey: 'nav.banners', icon: TableIcon, group: 'management', permissionKey: 'banners', pluginKey: 'marketing' },
  { id: 'newsletter', path: '/marketing/newsletter', labelKey: 'nav.newsletter', icon: MailIcon, group: 'management', permissionKey: 'newsletter', pluginKey: 'marketing' },
  { id: 'loyalty', path: '/loyalty', labelKey: 'nav.loyalty', icon: ShootingStarIcon, group: 'management', permissionKey: 'loyalty', pluginKey: 'loyaltyPoints' },
  { id: 'notifications', path: '/notifications', labelKey: 'nav.notifications', icon: PaperPlaneIcon, group: 'management', permissionKey: 'notifications', pluginKey: 'notifications' },

  // Platform
  { id: 'auditLogs', path: '/audit-logs', labelKey: 'nav.auditLogs', icon: PieChartIcon, group: 'platform', permissionKey: 'auditlogs', pluginKey: 'auditLogs' },
  { id: 'tenants', path: '/admin/tenants', labelKey: 'nav.tenants', icon: PlugInIcon, group: 'platform', permissionKey: 'admin.tenants', superOnly: true },

  // Settings
  { id: 'permissions', path: '/settings/permissions', labelKey: 'nav.permissions', icon: LockIcon, group: 'settings', permissionKey: 'permissions' },
  { id: 'profile', path: '/settings/profile', labelKey: 'nav.profile', icon: UserCircleIcon, group: 'settings', alwaysShow: true },
];

export const SECTION_GROUPS: { id: SectionDef['group']; labelKey: TranslationKey }[] = [
  { id: 'main', labelKey: 'menu.main' },
  { id: 'management', labelKey: 'menu.management' },
  { id: 'platform', labelKey: 'menu.platform' },
  { id: 'settings', labelKey: 'menu.settings' },
];
