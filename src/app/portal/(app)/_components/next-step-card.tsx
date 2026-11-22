import Link from "next/link";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/shared/icon";
import { Mascot } from "@/components/shared/mascot";
import type { MascotPose } from "@/config/mascots";

export interface NextStep {
  pose: MascotPose;
  title: string;
  text: string;
  href: string;
  action: string;
}

export function NextStepCard({ step }: { step: NextStep }) {
  return (
    <section
      aria-label="Langkah berikutnya"
      className="relative mt-10 flex min-h-36 items-center overflow-visible rounded-xl border border-(--line-strong) bg-(--band) pr-32 sm:pr-44"
    >
      <div className="grid gap-1 p-4">
        <h2 className="text-base leading-snug font-semibold">{step.title}</h2>
        <p className="text-xs text-neutral-700 dark:text-neutral-300">{step.text}</p>
        <Link
          href={step.href}
          className="hit-44 mt-2 inline-flex h-9 w-fit items-center gap-1.5 rounded-lg border border-primary-800 bg-primary-700 px-3 text-xs font-semibold text-white hover:bg-primary-800"
        >
          {step.action}
          <Icon icon={ArrowRight01Icon} className="arrow-nudge size-4" />
        </Link>
      </div>
      <Mascot
        pose={step.pose}
        sizes="(min-width: 640px) 120px, 96px"
        className="absolute right-3 bottom-0 h-44 w-auto sm:right-6 sm:h-52"
      />
    </section>
  );
}
