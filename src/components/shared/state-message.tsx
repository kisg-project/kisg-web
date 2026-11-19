import type { ReactNode } from "react";
import { CircleAlert, Inbox, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StateMessageProps {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  icon?: LucideIcon;
  className?: string;
}

function StateMessage({
  title,
  description,
  action,
  icon: Icon,
  tone,
  className,
}: StateMessageProps & { tone: "empty" | "error" }) {
  const FallbackIcon = tone === "error" ? CircleAlert : Inbox;
  const ShownIcon = Icon ?? FallbackIcon;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-10 text-center",
        className,
      )}
    >
      <ShownIcon
        aria-hidden="true"
        className={cn("size-8", tone === "error" ? "text-destructive" : "text-muted-foreground")}
      />
      <p className="text-base font-semibold">{title}</p>
      {description ? <p className="max-w-md text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

/** Keadaan kosong: data belum ada. Judul singkat, deskripsi menyebut langkah berikutnya. */
export function EmptyState(props: StateMessageProps) {
  return <StateMessage tone="empty" {...props} />;
}

/** Keadaan error: apa yang salah dan apa yang bisa dilakukan, tanpa pesan teknis. */
export function ErrorState(props: StateMessageProps) {
  return <StateMessage tone="error" {...props} />;
}
