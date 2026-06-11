"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { HorizontaLDots } from "../icons/index";
import { useI18n } from "@/lib/i18n";
import { usePermissions } from "@/lib/permissions";
import { usePluginStatus } from "@/lib/plugins";
import { SECTIONS, SECTION_GROUPS, type SectionDef } from "@/lib/navigation/sections";

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const { t } = useI18n();
  const { canAccess, isSuperAdmin } = usePermissions();
  const { isEnabled } = usePluginStatus();

  const showLabels = isExpanded || isHovered || isMobileOpen;

  const isVisible = (s: SectionDef): boolean => {
    if (s.superOnly && !isSuperAdmin) return false;
    if (!s.alwaysShow && s.permissionKey && !canAccess(s.permissionKey)) return false;
    if (s.pluginKey && !isEnabled(s.pluginKey)) return false;
    return true;
  };

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(path + "/");

  const renderGroup = (groupId: SectionDef["group"], labelKey: Parameters<typeof t>[0]) => {
    const items = SECTIONS.filter((s) => s.group === groupId && isVisible(s));
    if (items.length === 0) return null;

    return (
      <div key={groupId}>
        <h2
          className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
            !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
          }`}
        >
          {showLabels ? t(labelKey) : <HorizontaLDots />}
        </h2>
        <ul className="flex flex-col gap-2">
          {items.map((s) => {
            const Icon = s.icon;
            return (
              <li key={s.id}>
                <Link
                  href={s.path}
                  className={`menu-item group ${
                    isActive(s.path) ? "menu-item-active" : "menu-item-inactive"
                  } ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"}`}
                >
                  <span
                    className={
                      isActive(s.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"
                    }
                  >
                    <Icon className="w-5 h-5" />
                  </span>
                  {showLabels && <span className="menu-item-text">{t(s.labelKey)}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-[calc(100vh-4rem)] lg:h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200
        ${isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}
      >
        <Link href="/">
          {showLabels ? (
            <>
              <Image className="dark:hidden" src="/images/logo/logo.svg" alt="Logo" width={150} height={40} />
              <Image className="hidden dark:block" src="/images/logo/logo-dark.svg" alt="Logo" width={150} height={40} />
            </>
          ) : (
            <Image src="/images/logo/logo-icon.svg" alt="Logo" width={32} height={32} />
          )}
        </Link>
      </div>
      <div className="flex flex-col flex-1 min-h-0 overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            {SECTION_GROUPS.map((g) => renderGroup(g.id, g.labelKey))}
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
