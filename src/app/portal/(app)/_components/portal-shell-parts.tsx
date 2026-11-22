import Link from "next/link";
import { Avatar } from "@/components/shared/avatar";
import { bottomItems, railItems } from "@/config/portal-nav";
import { getPortalUser, LogoutButton } from "@/features/auth";
import { avatarUrl } from "@/features/users";
import { greetingFor, greetingName } from "@/lib/format/greeting";
import { PortalBottomNav, PortalSidebarNav } from "./portal-nav";

export async function SidebarNavForUser() {
  const user = await getPortalUser();
  return <PortalSidebarNav items={user ? railItems(user.roles, user.role) : []} />;
}

export async function BottomNavForUser() {
  const user = await getPortalUser();
  return <PortalBottomNav items={user ? bottomItems(user.roles, user.role) : []} />;
}

export async function HeaderGreeting() {
  const user = await getPortalUser();
  if (!user) return null;
  return (
    <p className="truncate text-[0.9375rem] font-medium tracking-tight lg:text-lg">
      {greetingFor(new Date())}, {greetingName(user.fullName) || "rekan KIS"}
    </p>
  );
}

export async function UserMenu() {
  const user = await getPortalUser();
  if (!user) return null;
  const photo = await avatarUrl(user.avatarPath);
  return (
    <div className="flex items-center gap-2">
      <Link
        href="/portal/akun"
        className="flex size-9 items-center justify-center overflow-hidden rounded-lg border border-(--line-strong) motion-safe:active:scale-95"
      >
        <span className="sr-only">Akun saya, </span>
        <Avatar src={photo} name={user.fullName} className="size-full rounded-none" />
      </Link>
      <LogoutButton iconOnly />
    </div>
  );
}
