import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ROLE_HOME } from "@/config/portal";
import { requirePortalUser } from "@/features/auth";
import { HomeIntro } from "../_components/module-placeholder";
import { ShortcutSection } from "../_components/shortcut-section";

export const metadata: Metadata = { title: "Beranda" };

export default async function GeneralHomePage() {
  const user = await requirePortalUser();
  if (ROLE_HOME[user.role] !== "/portal/beranda") redirect(ROLE_HOME[user.role]);
  return (
    <div className="tone-mint grid grid-cols-[minmax(0,1fr)] gap-5">
      <HomeIntro roles={user.roles} duties={user.duties} userId={user.id} label="Beranda" />
      <ShortcutSection roles={user.roles} primary={user.role} label="Fitur" />
    </div>
  );
}
