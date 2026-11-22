import Image from "next/image";
import { Calendar03Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/shared/icon";
import { ROLE_LABELS, type AppRole } from "@/config/roles";
import { greetingName, greetingFor } from "@/lib/format/greeting";
import { formatDateWIB } from "@/lib/format";

export interface GreetingStat {
  label: string;
  value: string;
}

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
  const name = greetingName(fullName) || "rekan KIS";
  return (
    <section className="relative isolate overflow-hidden rounded-2xl border border-(--line-strong) px-4 py-4 text-white sm:px-5">
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
      <p className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-0.5 text-[0.7rem] font-medium text-white/90 ring-1 ring-white/20 backdrop-blur-md">
        <Icon icon={Calendar03Icon} className="size-3.5" />
        {formatDateWIB(now)}
      </p>
      <h1 className="mt-3 tracking-tight [overflow-wrap:anywhere]">
        <span className="block text-sm font-normal text-white/85">{greetingFor(now)},</span>{" "}
        <span className="block text-2xl leading-tight font-semibold sm:text-3xl">{name}</span>
      </h1>
      <ul aria-label="Role" className="mt-3 flex flex-wrap gap-1.5">
        {roles.map((role) => (
          <li
            key={role}
            className="rounded-full bg-white/15 px-2.5 py-0.5 text-[0.7rem] font-medium ring-1 ring-white/25 backdrop-blur-md"
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
