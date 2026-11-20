import { Avatar } from "@/components/shared/avatar";
import { ROLE_LABELS, type AppRole } from "@/config/roles";
import { greetingFor } from "@/lib/format/greeting";
import { formatDateWIB } from "@/lib/format";

/**
 * Judul beranda portal: sapaan sesuai jam WIB, nama, foto, semua role (multi role, role utama di
 * depan), dan tanggal hari ini. Halaman portal selalu dirender per request (butuh sesi), jadi jam yang
 * dipakai adalah jam saat halaman dibuka.
 */
export function PortalGreeting({
  fullName,
  roles,
  avatarUrl,
  description,
}: {
  fullName: string;
  roles: readonly AppRole[];
  avatarUrl?: string | null;
  description?: string;
}) {
  const now = new Date();
  return (
    <header className="flex items-start gap-4">
      <Avatar src={avatarUrl ?? null} name={fullName} className="size-14 text-base" />
      <div className="flex min-w-0 flex-col gap-2">
        <p className="text-sm text-muted-foreground">{formatDateWIB(now)}</p>
        <h1 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">
          {greetingFor(now)}, {fullName || "rekan KIS"}
        </h1>
        <ul aria-label="Role" className="flex flex-wrap gap-1.5">
          {roles.map((role) => (
            <li key={role}>
              <span className="inline-flex items-center rounded-md bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-800">
                {ROLE_LABELS[role]}
              </span>
            </li>
          ))}
        </ul>
        {description ? <p className="text-muted-foreground">{description}</p> : null}
      </div>
    </header>
  );
}
