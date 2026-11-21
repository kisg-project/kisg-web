import Image from "next/image";
import { Avatar } from "@/components/shared/avatar";
import { ROLE_LABELS, type AppRole } from "@/config/roles";
import { greetingFor } from "@/lib/format/greeting";
import { formatDateWIB } from "@/lib/format";

export interface GreetingStat {
  label: string;
  value: string;
}

/**
 * Kartu sapaan beranda portal (gaya aplikasi, mengikuti Shaflow): foto proyek dengan gradasi warna
 * brand, tanggal, sapaan sesuai jam WIB dengan nama, semua role, dan ringkasan angka opsional.
 * Halaman portal dirender per request, jadi jam yang dipakai adalah jam saat halaman dibuka.
 */
export function PortalGreeting({
  fullName,
  roles,
  avatarUrl,
  description,
  stats = [],
}: {
  fullName: string;
  roles: readonly AppRole[];
  avatarUrl?: string | null;
  description?: string;
  stats?: readonly GreetingStat[];
}) {
  const now = new Date();
  const name = fullName || "rekan KIS";
  return (
    <section className="relative isolate overflow-hidden rounded-[2rem] px-5 pt-6 pb-5 text-white sm:px-7 sm:pt-8">
      <Image
        src="/images/projects/sejahtera-green-village/sgv-3.webp"
        alt=""
        fill
        preload
        sizes="(min-width: 1024px) 64rem, 100vw"
        className="-z-20 object-cover object-[60%_55%]"
      />
      <span
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-linear-to-r from-primary-950/95 via-primary-900/85 to-primary-900/45"
      />
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-medium text-white/85">{formatDateWIB(now)}</p>
        <Avatar src={avatarUrl ?? null} name={name} className="size-12 ring-2 ring-white/40" />
      </div>
      <h1 className="mt-2 text-[2rem] leading-[1.1] font-semibold tracking-tight [overflow-wrap:anywhere] sm:text-5xl">
        {greetingFor(now)}, {name}
      </h1>
      <ul aria-label="Role" className="mt-3 flex flex-wrap gap-1.5">
        {roles.map((role) => (
          <li
            key={role}
            className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold ring-1 ring-white/25 backdrop-blur-md"
          >
            {ROLE_LABELS[role]}
          </li>
        ))}
      </ul>
      {description ? <p className="mt-3 max-w-xl text-white/85">{description}</p> : null}
      {stats.length > 0 ? (
        <dl className="mt-5 grid grid-cols-3 gap-2">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex min-w-0 flex-col rounded-2xl bg-white/15 px-3 py-2.5 ring-1 ring-white/25 backdrop-blur-md"
            >
              <dt className="truncate text-[0.7rem] font-medium text-white/80">{stat.label}</dt>
              <dd className="truncate text-base font-semibold tabular">{stat.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  );
}
