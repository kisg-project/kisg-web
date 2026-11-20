import Link from "next/link";
import { Avatar } from "@/components/shared/avatar";
import { portalAreasFor } from "@/config/portal";
import { ROLE_LABELS } from "@/config/roles";
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
  const extra = user.roles.length - 1;
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Link
        href="/portal/akun"
        className="flex min-h-11 min-w-0 items-center gap-2 rounded-md px-1 hover:bg-accent"
        aria-label={`Akun saya: ${user.fullName}`}
      >
        <Avatar src={photo} name={user.fullName} className="size-9" />
        <span className="hidden min-w-0 text-right sm:block">
          <span className="block truncate text-sm font-semibold">{user.fullName}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {ROLE_LABELS[user.role]}
            {extra > 0 ? ` +${String(extra)}` : ""}
          </span>
        </span>
      </Link>
      <LogoutButton />
    </div>
  );
}
