import Link from "next/link";
import { Reveal } from "@/components/shared/reveal";
import { formatDateWIB } from "@/lib/format";
import type { CareerSummary } from "../types";
import { ArrowRight02Icon, Briefcase01Icon, Location01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/shared/icon";

export function CareerList({ careers }: { careers: readonly CareerSummary[] }) {
  return (
    <ul className="grid gap-4">
      {careers.map((career, index) => (
        <li key={career.id}>
          <Reveal delay={index * 60}>
            <Link
              href={`/karir/${career.slug}`}
              className="group flex lift flex-col gap-3 rounded-3xl border border-primary-100 bg-card p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between"
            >
              <span>
                <span className="block text-lg font-bold group-hover:text-primary">
                  {career.title}
                </span>
                <span className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  {career.department ? (
                    <span className="inline-flex items-center gap-1">
                      <Icon icon={Briefcase01Icon} aria-hidden="true" className="size-4" />
                      {career.department}
                    </span>
                  ) : null}
                  {career.location ? (
                    <span className="inline-flex items-center gap-1">
                      <Icon icon={Location01Icon} aria-hidden="true" className="size-4" />
                      {career.location}
                    </span>
                  ) : null}
                  {career.closesOn ? <span>Ditutup {formatDateWIB(career.closesOn)}</span> : null}
                </span>
              </span>
              <Icon
                icon={ArrowRight02Icon}
                aria-hidden="true"
                className="size-5 shrink-0 text-primary"
              />
            </Link>
          </Reveal>
        </li>
      ))}
    </ul>
  );
}
