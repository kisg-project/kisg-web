import Link from "next/link";
import { Moon02Icon, Sun03Icon, SunriseIcon, SunsetIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/shared/icon";
import { Avatar } from "@/components/shared/avatar";
import { LiveRefresh } from "@/components/shared/live-refresh";
import { bottomItems, railItems } from "@/config/portal-nav";
import { getPortalUser, LogoutButton } from "@/features/auth";
import { avatarUrl } from "@/features/users";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { greetingFor, greetingName } from "@/lib/format/greeting";
import { cn } from "@/lib/utils";
import { PortalBottomNav, PortalSidebarNav } from "./portal-nav";

export async function SidebarNavForUser() {
  const user = await getPortalUser();
  return <PortalSidebarNav items={user ? railItems(user.roles, user.role) : []} />;
}

export async function BottomNavForUser() {
  const user = await getPortalUser();
  return <PortalBottomNav items={user ? bottomItems(user.roles, user.role) : []} />;
}

const TIME_ICON = {
  "Selamat pagi": { icon: SunriseIcon, tone: "bg-gold-100 text-gold-800 ring-gold-200" },
  "Selamat siang": { icon: Sun03Icon, tone: "bg-orange-100 text-orange-700 ring-orange-200" },
  "Selamat sore": { icon: SunsetIcon, tone: "bg-violet-100 text-violet-700 ring-violet-200" },
  "Selamat malam": { icon: Moon02Icon, tone: "bg-info-100 text-info-700 ring-info-200" },
} as const;

export async function HeaderGreeting() {
  const user = await getPortalUser();
  if (!user) return null;
  const greeting = greetingFor(new Date());
  const time = TIME_ICON[greeting];
  return (
    <p className="flex min-w-0 items-center gap-2">
      <span className="truncate text-[0.9375rem] font-medium tracking-tight lg:text-lg">
        {greeting}, {greetingName(user.fullName) || "rekan KIS"}
      </span>
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full ring-1",
          time.tone,
        )}
      >
        <Icon icon={time.icon} className="size-4" />
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
