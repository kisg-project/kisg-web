import Link from "next/link";
import { Avatar } from "@/components/shared/avatar";
import { portalAreasFor } from "@/config/portal";
import { getPortalUser, LogoutButton } from "@/features/auth";
import { avatarUrl } from "@/features/users";
import { PortalBottomNav, PortalDrawer, PortalSidebarNav, type PortalNavItem } from "./portal-nav";

async function navItems(): Promise<PortalNavItem[]> {
  const user = await getPortalUser();
  if (!user) return [];
  return portalAreasFor(user.roles).map(({ prefix, label, shortLabel }) => ({
    href: prefix,
    label,
    shortLabel,
  }));
}

export async function SidebarNavForUser() {
  return <PortalSidebarNav items={await navItems()} />;
}

export async function BottomNavForUser() {
  return <PortalBottomNav items={await navItems()} />;
}

export async function DrawerForUser() {
  return <PortalDrawer items={await navItems()} />;
}

export async function UserMenu() {
  const user = await getPortalUser();
  if (!user) return null;
  const photo = await avatarUrl(user.avatarPath);
  return (
    <div className="flex items-center gap-1.5">
      <Link
        href="/portal/akun"
        className="inline-flex size-10 items-center justify-center rounded-full border border-(--line-strong) motion-safe:active:scale-95"
      >
        <span className="sr-only">Akun saya, </span>
        <Avatar src={photo} name={user.fullName} className="size-9" />
      </Link>
      <LogoutButton iconOnly />
    </div>
  );
}
