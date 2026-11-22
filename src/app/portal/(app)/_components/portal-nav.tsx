"use client";

import { AppBottomNav, AppSidebarNav, type ShellConfig } from "@/components/shared/app-nav";
import type { PortalNavItem } from "@/config/portal-nav";

export { StickyHeader } from "@/components/shared/app-nav";

const PORTAL: ShellConfig = {
  base: "/portal",
  brand: "KIS Operasional",
  navLabel: "Menu portal",
  bottomLabel: "Menu portal bawah",
  account: { href: "/portal/akun", label: "Akun", railLabel: "Pengaturan akun" },
};

export function PortalBottomNav({ items }: { items: readonly PortalNavItem[] }) {
  return <AppBottomNav items={items} config={PORTAL} />;
}

export function PortalSidebarNav({ items }: { items: readonly PortalNavItem[] }) {
  return <AppSidebarNav items={items} config={PORTAL} />;
}
