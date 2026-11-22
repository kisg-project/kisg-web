"use client";

import type * as React from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import {
  Alert02Icon,
  CancelCircleIcon,
  CheckmarkCircle02Icon,
  InformationCircleIcon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/shared/icon";

function Toaster({ theme = "light", ...props }: ToasterProps) {
  return (
    <Sonner
      theme={theme}
      className="toaster group"
      icons={{
        success: <Icon icon={CheckmarkCircle02Icon} className="size-4" />,
        info: <Icon icon={InformationCircleIcon} className="size-4" />,
        warning: <Icon icon={Alert02Icon} className="size-4" />,
        error: <Icon icon={CancelCircleIcon} className="size-4" />,
        loading: <Icon icon={Loading03Icon} className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{ classNames: { toast: "cn-toast" } }}
      {...props}
    />
  );
}

export { Toaster };
