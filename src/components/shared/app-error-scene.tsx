import type { ReactNode } from "react";
import { Mascot } from "@/components/shared/mascot";
import type { MascotPose } from "@/config/mascots";

export function AppErrorScene({
  code,
  title,
  description,
  actions,
  pose,
}: {
  code: "404" | "500";
  title: string;
  description: string;
  actions: ReactNode;
  pose: MascotPose;
}) {
  return (
    <section className="mx-auto mt-4 grid w-full max-w-2xl items-end gap-4 overflow-hidden rounded-2xl border border-(--line-strong) bg-(--band-soft,var(--color-primary-50)) px-5 pt-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:px-8 sm:pt-8">
      <div className="grid gap-3 pb-2 sm:pb-8">
        <span className="w-fit rounded-full border border-(--line-strong) bg-card px-2.5 py-0.5 text-[0.6875rem] font-semibold text-neutral-700 tabular-nums dark:text-neutral-200">
          Kode {code}
        </span>
        <h1 className="text-lg leading-tight font-semibold tracking-tight sm:text-xl">{title}</h1>
        <p className="text-[0.8125rem] text-neutral-700 dark:text-neutral-300">{description}</p>
        <div className="mt-1 flex flex-wrap gap-2">{actions}</div>
      </div>
      <Mascot
        pose={pose}
        eager
        sizes="(min-width: 640px) 180px, 140px"
        className="mx-auto w-32 sm:mx-0 sm:w-40"
      />
    </section>
  );
}
