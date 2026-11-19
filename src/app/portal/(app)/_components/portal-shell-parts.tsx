import { portalAreasFor } from "@/config/portal";
import { ROLE_LABELS } from "@/config/roles";
import { getPortalUser, LogoutButton } from "@/features/auth";
import { PortalBottomNav, PortalSidebarNav, type PortalNavItem } from "./portal-nav";

async function navItems(): Promise<PortalNavItem[]> {
  const user = await getPortalUser();
  if (!user) return [];
  return portalAreasFor(user.role).map(({ prefix, label, shortLabel }) => ({
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
  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="hidden min-w-0 text-right sm:block">
        <p className="truncate text-sm font-semibold">{user.fullName}</p>
        <p className="truncate text-xs text-muted-foreground">{ROLE_LABELS[user.role]}</p>
      </div>
      <LogoutButton />
    </div>
  );
}
