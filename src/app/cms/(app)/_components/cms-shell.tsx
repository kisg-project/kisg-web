import { GREETING_EMOJI } from "@/config/greeting-emoji";
import { LogoutButton } from "@/features/auth";
import { requireCmsUser } from "@/features/cms-panel";
import { greetingFor, greetingName } from "@/lib/format/greeting";

export async function CmsGreeting() {
  const user = await requireCmsUser();
  const greeting = greetingFor(new Date());
  const name = greetingName(user.fullName) || "tim konten";
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

export function CmsUserMenu() {
  return <LogoutButton action="/cms/auth/keluar" iconOnly />;
}
