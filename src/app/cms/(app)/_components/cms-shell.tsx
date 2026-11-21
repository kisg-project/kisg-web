import { CmsNavLinks } from "./cms-nav-links";
import { LogoutButton } from "@/features/auth";
import { requireCmsUser } from "@/features/cms-panel";

export function CmsNav() {
  return <CmsNavLinks />;
}

export async function CmsUserMenu() {
  const user = await requireCmsUser();
  return (
    <div className="flex items-center gap-2">
      <span className="hidden max-w-48 truncate text-sm text-subtle-foreground sm:block">
        {user.fullName || user.email}
      </span>
      <LogoutButton action="/cms/auth/keluar" />
    </div>
  );
}
