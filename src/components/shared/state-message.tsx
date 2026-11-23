import type { ReactNode } from "react";
import { Alert02Icon, Task01Icon } from "@hugeicons/core-free-icons";
import { Icon, type AppIcon } from "@/components/shared/icon";
import { cn } from "@/lib/utils";
import { LottiePlayer } from "./lottie-player";

interface StateMessageProps {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  icon?: AppIcon;
  className?: string;
}

function StateIllustration({ icon, tone }: { icon: AppIcon; tone: "empty" | "error" }) {
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
      <span className="empty-float relative grid size-16 place-items-center rounded-2xl border-2 border-neutral-800 bg-primary-50 dark:border-neutral-300 dark:bg-primary-950">
        <Icon
          icon={icon}
          className={cn(
            "size-8",
            error ? "text-destructive" : "text-neutral-800 dark:text-neutral-100",
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
  icon,
  tone,
  className,
}: StateMessageProps & { tone: "empty" | "error" }) {
  const shown = icon ?? (tone === "error" ? Alert02Icon : Task01Icon);
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-(--line-strong,var(--color-border)) px-5 py-8 text-center",
        className,
      )}
    >
      {tone === "empty" ? (
        <LottiePlayer
          name="empty-box"
          className="mb-1 size-28"
          fallback={<StateIllustration icon={shown} tone={tone} />}
        />
      ) : (
        <StateIllustration icon={shown} tone={tone} />
      )}
      <p className="text-sm font-semibold sm:text-base">{title}</p>
      {description ? (
        <p className="max-w-md text-xs text-muted-foreground sm:text-sm">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function EmptyState(props: StateMessageProps) {
  return <StateMessage tone="empty" {...props} />;
}

export function ErrorState(props: StateMessageProps) {
  return <StateMessage tone="error" {...props} />;
}
