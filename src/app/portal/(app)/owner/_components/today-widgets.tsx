import { Clock01Icon, Location01Icon } from "@hugeicons/core-free-icons";
import { Avatar } from "@/components/shared/avatar";
import { Icon } from "@/components/shared/icon";
import { EmptyState } from "@/components/shared/state-message";
import type { OverviewException } from "@/features/attendance";
import { formatTimeWIB } from "@/lib/format";
import { LiveClock } from "./live-clock";
import { Pill, Widget, WidgetLink } from "./widget";

const hhmm = (value: string) => value.slice(0, 5).replace(":", ".");

export function WorkHoursWidget({
  schedule,
  workday,
  summary,
}: {
  schedule: { startTime: string; endTime: string } | null;
  workday: boolean;
  summary: { total: number; present: number; late: number; absent: number };
}) {
  return (
    <Widget
      id="widget-jam-kerja"
      title="Jam kerja hari ini"
      action={<WidgetLink href="/portal/owner/jam-kerja">Atur</WidgetLink>}
    >
      <div className="overflow-hidden rounded-lg border border-(--line-strong)">
        <div className="flex items-center justify-between gap-2 border-b border-(--line-strong) bg-orange-50 px-3 py-2 dark:bg-neutral-900">
          <span className="flex items-center gap-2 text-xs font-semibold">
            <span className="ring-orange-200 flex size-6 items-center justify-center rounded-full bg-card ring-1">
              <Icon icon={Clock01Icon} className="size-3.5 text-orange-700" />
            </span>
            Jam kerja kantor
          </span>
          <Pill tone={workday ? "green" : "gray"}>{workday ? "Hari kerja" : "Hari libur"}</Pill>
        </div>
        <div className="grid justify-items-center gap-1 px-3 py-4">
          <span className="text-[0.6875rem] text-muted-foreground">Waktu sekarang, WIB</span>
          <LiveClock className="text-3xl font-semibold tracking-tight tabular-nums" />
          {schedule ? (
            <span className="mt-1 flex gap-2 text-[0.6875rem] font-medium">
              <span className="rounded-md border border-(--line-soft) px-2 py-0.5 tabular-nums">
                Masuk {hhmm(schedule.startTime)}
              </span>
              <span className="rounded-md border border-(--line-soft) px-2 py-0.5 tabular-nums">
                Pulang {hhmm(schedule.endTime)}
              </span>
            </span>
          ) : null}
        </div>
      </div>
      <div className="grid gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Tim hari ini</span>
        <span className="flex flex-wrap gap-1.5">
          <Pill tone="green">{`Hadir ${String(summary.present)} dari ${String(summary.total)}`}</Pill>
          <Pill tone="orange">{`Terlambat ${String(summary.late)}`}</Pill>
          <Pill tone="gray">{`Belum absen ${String(summary.absent)}`}</Pill>
        </span>
      </div>
    </Widget>
  );
}

const STATUS = {
  menunggu: { tone: "orange", label: "Menunggu" },
  disetujui: { tone: "green", label: "Disetujui" },
  ditolak: { tone: "red", label: "Ditolak" },
} as const;

export function ApprovalsWidget({
  pending,
  decided,
}: {
  pending: OverviewException[];
  decided: OverviewException[];
}) {
  const items = [...pending, ...decided].slice(0, 4);
  return (
    <Widget
      id="widget-persetujuan"
      title="Persetujuan"
      action={<WidgetLink href="/portal/owner/absensi">Lihat semua</WidgetLink>}
    >
      <div className="grid grid-cols-2 gap-1 rounded-lg border border-(--line-strong) bg-violet-50 p-1 text-xs font-medium dark:bg-neutral-900">
        <span className="flex items-center justify-center gap-1.5 rounded-md bg-card py-1.5 ring-1 ring-(--line-strong)">
          Menunggu
          <span className="rounded-full bg-warning-100 px-1.5 text-[0.625rem] font-semibold text-warning-800 tabular-nums">
            {pending.length}
          </span>
        </span>
        <span className="flex items-center justify-center gap-1.5 py-1.5 text-muted-foreground">
          Diputuskan
          <span className="rounded-full bg-neutral-100 px-1.5 text-[0.625rem] font-semibold tabular-nums dark:bg-neutral-800">
            {decided.length}
          </span>
        </span>
      </div>
      {items.length === 0 ? (
        <EmptyState title="Belum ada pengajuan hari ini" className="py-4" />
      ) : (
        <ul aria-label="Daftar persetujuan" className="grid gap-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-2.5 rounded-lg border border-(--line-strong) px-2.5 py-2"
            >
              <Avatar src={null} name={item.userName} className="size-7 text-[0.625rem]" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold">{item.userName}</span>
                <span className="flex items-center gap-1 truncate text-[0.6875rem] text-muted-foreground tabular-nums">
                  <Icon icon={Location01Icon} className="size-3" />
                  {item.kind === "masuk" ? "Clock in" : "Clock out"}{" "}
                  {formatTimeWIB(item.requestedAt)}
                </span>
              </span>
              <Pill tone={STATUS[item.status].tone}>{STATUS[item.status].label}</Pill>
            </li>
          ))}
        </ul>
      )}
    </Widget>
  );
}
