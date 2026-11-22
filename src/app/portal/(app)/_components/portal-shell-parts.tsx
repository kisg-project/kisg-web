import Link from "next/link";
import { Avatar } from "@/components/shared/avatar";
import { LiveRefresh } from "@/components/shared/live-refresh";
import { GREETING_EMOJI } from "@/config/greeting-emoji";
import { bottomItems, railItems } from "@/config/portal-nav";
import { getPortalUser, LogoutButton } from "@/features/auth";
import { NotificationBell } from "@/features/notifications";
import { avatarUrl } from "@/features/users";
import { getSupabaseConfig } from "@/lib/supabase/config";
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
  const greeting = greetingFor(new Date());
  const name = greetingName(user.fullName) || "rekan KIS";
  const first = name.split(" ")[0] ?? name;
  return (
    <p className="flex min-w-0 items-center gap-1.5 text-[0.9375rem] font-medium tracking-tight lg:text-lg">
      <span className="truncate sm:hidden">
        {greeting}, {first}
      </span>
      <span className="hidden truncate sm:inline">
        {greeting}, {name}
      </span>
      <span aria-hidden="true" className="shrink-0 text-lg leading-none lg:text-xl">
        {GREETING_EMOJI[greeting]}
      </span>
    </p>
  );
}

export async function UserMenu() {
  const user = await getPortalUser();
  if (!user) return null;
  const photo = await avatarUrl(user.avatarPath);
  return (
    <div className="flex items-center gap-2">
      <NotificationBell userId={user.id} />
      <Link
        href="/portal/akun"
        className="hit-44 flex size-9 items-center justify-center overflow-hidden rounded-lg border border-(--line-strong) motion-safe:active:scale-95"
      >
        <span className="sr-only">Akun saya, </span>
        <Avatar src={photo} name={user.fullName} className="size-full rounded-none" />
      </Link>
      <LogoutButton iconOnly />
    </div>
  );
}

export async function LiveRefreshForUser() {
  const user = await getPortalUser();
  if (!user) return null;
  const { url, publishableKey } = getSupabaseConfig();
  return <LiveRefresh url={url} publishableKey={publishableKey} />;
}
