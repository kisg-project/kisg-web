import Link from "next/link";
import { Avatar } from "@/components/shared/avatar";
import { portalAreasFor } from "@/config/portal";
import { getPortalUser, LogoutButton } from "@/features/auth";
import { avatarUrl } from "@/features/users";
import { PortalBottomNav, PortalSidebarNav, type PortalNavItem } from "./portal-nav";

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

export async function UserMenu() {
  const user = await getPortalUser();
  if (!user) return null;
  const photo = await avatarUrl(user.avatarPath);
  return (
    <div className="flex items-center gap-1">
      <Link
        href="/portal/akun"
        className="inline-flex size-11 items-center justify-center rounded-full ring-2 ring-background transition-transform hover:ring-primary-200 motion-safe:active:scale-95"
      >
        <span className="sr-only">Akun saya, </span>
        <Avatar src={photo} name={user.fullName} className="size-10" />
      </Link>
      <LogoutButton />
    </div>
  );
}
