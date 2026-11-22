"use client";

import { Briefcase01Icon, DashboardSquare01Icon, News01Icon } from "@hugeicons/core-free-icons";
import { AppBottomNav, AppSidebarNav, type ShellConfig } from "@/components/shared/app-nav";
import type { PortalNavItem } from "@/config/portal-nav";

const CMS: ShellConfig = {
  base: "/cms",
  brand: "Panel CMS",
  navLabel: "Menu CMS",
  bottomLabel: "Menu CMS",
  account: null,
};

const ITEMS: PortalNavItem[] = [
  { href: "/cms", label: "Ringkasan", icon: DashboardSquare01Icon, home: true },
  { href: "/cms/berita", label: "Berita", icon: News01Icon, home: false },
  { href: "/cms/lowongan", label: "Lowongan", icon: Briefcase01Icon, home: false },
];

export function CmsSidebar() {
  return <AppSidebarNav items={ITEMS} config={CMS} />;
}

export function CmsBottomNav() {
  return <AppBottomNav items={ITEMS} config={CMS} />;
}
