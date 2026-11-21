import Image from "next/image";
import { CalendarDays } from "lucide-react";
import { RoofLine } from "@/components/shared/roof-line";
import { ROLE_LABELS, type AppRole } from "@/config/roles";
import { firstName, greetingFor } from "@/lib/format/greeting";
import { formatDateWIB } from "@/lib/format";

export interface GreetingStat {
  label: string;
  value: string;
}

/**
 * Kartu sapaan beranda portal: foto proyek dengan gradasi warna brand, tanggal, lalu sapaan dua baris
 * ("Selamat malam," dan nama depan), semua role, dan ringkasan angka opsional. Foto profil tidak
 * diulang di sini karena sudah ada di header (keputusan owner, 21 November 2026). Halaman portal
 * dirender per request, jadi jam yang dipakai adalah jam saat halaman dibuka.
 */
export function PortalGreeting({
  fullName,
  roles,
  description,
  stats = [],
}: {
  fullName: string;
  roles: readonly AppRole[];
  description?: string;
  stats?: readonly GreetingStat[];
}) {
  const now = new Date();
  const name = firstName(fullName) || "rekan KIS";
  return (
    <section className="relative isolate overflow-hidden rounded-[2rem] px-5 pt-5 pb-5 text-white shadow-[0_24px_48px_-28px_rgb(1_60_52/0.7)] sm:px-7 sm:pt-7">
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
        className="absolute inset-0 -z-10 bg-linear-to-br from-primary-950 via-primary-900/90 to-primary-800/55"
      />
      <RoofLine
        strokeWidth={3}
        className="absolute -right-8 bottom-10 -z-10 h-24 w-64 text-gold-300/40"
      />
      <p className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-white/90 ring-1 ring-white/20 backdrop-blur-md">
        <CalendarDays aria-hidden="true" className="size-3.5" />
        {formatDateWIB(now)}
      </p>
      <h1 className="mt-4 tracking-tight [overflow-wrap:anywhere]">
        <span className="block text-lg font-medium text-white/85 sm:text-xl">
          {greetingFor(now)},
        </span>{" "}
        <span className="block text-[2.25rem] leading-[1.05] font-bold sm:text-5xl">{name}</span>
      </h1>
      <ul aria-label="Role" className="mt-4 flex flex-wrap gap-1.5">
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
