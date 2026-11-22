import { PageHeader } from "@/components/shared/page-header";
import { ROLE_LABELS, type AppRole } from "@/config/roles";

const longDate = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function HomeHeader({
  roles,
  description,
}: {
  roles: readonly AppRole[];
  description?: string;
}) {
  return (
    <PageHeader
      title={longDate.format(new Date())}
      description={description}
      actions={
        <ul aria-label="Role" className="flex flex-wrap gap-1.5">
          {roles.map((role) => (
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
  );
}
