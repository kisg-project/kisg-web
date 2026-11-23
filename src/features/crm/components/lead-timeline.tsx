import {
  Call02Icon,
  Exchange01Icon,
  MessageMultiple01Icon,
  Note01Icon,
  Task01Icon,
} from "@hugeicons/core-free-icons";
import { Icon, type AppIcon } from "@/components/shared/icon";
import { LEAD_ACTIVITY_LABEL, LEAD_ASSIGNMENT_LABEL, type LeadActivityType } from "@/config/crm";
import { formatDateTimeWIB } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { LeadTimelineItem } from "../types";

const ACTIVITY_ICON: Partial<Record<LeadActivityType, { icon: AppIcon; tone: string }>> = {
  telepon: { icon: Call02Icon, tone: "bg-primary-100 text-primary-700" },
  whatsapp: { icon: MessageMultiple01Icon, tone: "bg-success-100 text-success-800" },
  perubahan_tahap: { icon: Task01Icon, tone: "bg-violet-100 text-violet-700" },
};
const FALLBACK = { icon: Note01Icon, tone: "bg-orange-100 text-orange-700" };
const ASSIGNMENT = { icon: Exchange01Icon, tone: "bg-info-100 text-info-800" };

function describe(item: LeadTimelineItem): string {
  if (item.kind === "pembagian" && item.reason) {
    const label = LEAD_ASSIGNMENT_LABEL[item.reason];
    return item.toName ? `${label}: ${item.toName}` : label;
  }
  return item.activityType ? LEAD_ACTIVITY_LABEL[item.activityType] : "Aktivitas";
}

export function LeadTimeline({ items }: { items: readonly LeadTimelineItem[] }) {
  return (
    <ol aria-label="Riwayat lead" className="grid gap-3">
      {items.map((item) => {
        const look =
          item.kind === "pembagian"
            ? ASSIGNMENT
            : ((item.activityType ? ACTIVITY_ICON[item.activityType] : undefined) ?? FALLBACK);
        return (
          <li key={`${item.kind}-${item.id}`} className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className={cn("grid size-8 shrink-0 place-items-center rounded-lg", look.tone)}
            >
              <Icon icon={look.icon} size={16} />
            </span>
            <div className="grid min-w-0 gap-0.5">
              <p className="text-[0.8125rem] font-semibold">{describe(item)}</p>
              {item.body ? (
                <p className="text-xs break-words whitespace-pre-line text-foreground">
                  {item.body}
                </p>
              ) : null}
              <p className="text-[0.6875rem] text-muted-foreground tabular-nums">
                {formatDateTimeWIB(item.at)}
                {item.actorName ? `, ${item.actorName}` : ""}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
