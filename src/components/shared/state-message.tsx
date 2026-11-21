import type { ReactNode } from "react";
import { CircleAlert, Inbox, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { LottiePlayer } from "./lottie-player";

interface StateMessageProps {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  icon?: LucideIcon;
  className?: string;
}

/**
 * Ilustrasi bergerak untuk keadaan kosong dan error: ikon di lingkaran yang melayang pelan, bayangan
 * mengikuti, cincin berdenyut, dan dua titik kecil berkedip. Diam saat prefers-reduced-motion aktif.
 */
function StateIllustration({ icon: Icon, tone }: { icon: LucideIcon; tone: "empty" | "error" }) {
  const error = tone === "error";
  return (
    <div aria-hidden="true" className="relative mb-1 grid size-28 place-items-center">
      <span
        className={cn(
          "empty-ping absolute size-20 rounded-full",
          error ? "bg-danger-100 dark:bg-danger-950" : "bg-primary-100 dark:bg-primary-950",
        )}
      />
      <span
        className={cn(
          "empty-twinkle absolute top-3 right-4 size-2 rounded-full",
          error ? "bg-danger-300" : "bg-gold-400",
        )}
      />
      <span
        className={cn(
          "empty-twinkle absolute bottom-7 left-3 size-1.5 rounded-full [animation-delay:1.2s]",
          error ? "bg-danger-300" : "bg-primary-400",
        )}
      />
      <span className="empty-float relative grid size-16 place-items-center rounded-3xl bg-card shadow-lg ring-1 ring-border">
        <Icon
          className={cn(
            "size-8",
            error ? "text-destructive" : "text-primary-600 dark:text-primary-300",
          )}
        />
      </span>
      <span className="empty-shadow absolute bottom-1 h-2 w-12 rounded-full bg-foreground/10" />
    </div>
  );
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
        "flex flex-col items-center gap-3 rounded-3xl border border-dashed px-6 py-10 text-center",
        className,
      )}
    >
      {tone === "empty" ? (
        <LottiePlayer
          name="empty-box"
          className="mb-1 size-28"
          fallback={<StateIllustration icon={ShownIcon} tone={tone} />}
        />
      ) : (
        <StateIllustration icon={ShownIcon} tone={tone} />
      )}
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
