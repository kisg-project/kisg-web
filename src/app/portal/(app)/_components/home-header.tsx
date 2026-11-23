import { PageHeader } from "@/components/shared/page-header";
import { ROLE_LABELS, type AppRole } from "@/config/roles";
import type { InheritedDuty } from "@/lib/auth/account-roles";

const longDate = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function HomeHeader({
  roles,
  duties = [],
  description,
}: {
  roles: readonly AppRole[];
  duties?: readonly InheritedDuty[];
  description?: string;
}) {
  const own = roles.filter((role) => !duties.some((duty) => duty.role === role));
  return (
    <>
      <PageHeader
        title={longDate.format(new Date())}
        description={description}
        actions={
          <ul aria-label="Role" className="flex flex-wrap gap-1.5">
            {own.map((role) => (
              <li
                key={role}
                className="inline-flex h-7 items-center gap-1.5 rounded-full border border-(--line-strong) bg-card px-2.5 text-[0.6875rem] font-medium"
              >
                <span aria-hidden="true" className="size-1.5 rounded-full bg-primary-600" />
                {ROLE_LABELS[role]}
              </li>
            ))}
          </ul>
        }
      />
      {duties.length > 0 ? (
        <section
          aria-label="Tugas jabatan yang belum terisi"
          className="rounded-xl border border-(--line-strong) bg-warning-50 px-4 py-3 text-[0.8125rem] text-warning-900 dark:bg-warning-950 dark:text-warning-100"
        >
          <p className="font-semibold">Anda juga memegang tugas jabatan yang belum terisi</p>
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {duties.map((duty) => (
              <li
                key={`${duty.role}-${duty.positionTitle}`}
                className="rounded-full border border-warning-200 bg-card px-2.5 py-0.5 text-[0.6875rem] font-medium text-foreground"
              >
                {duty.positionTitle}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
