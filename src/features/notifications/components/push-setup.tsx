"use client";

import { useEffect, useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { Notification03Icon, NotificationOff01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/shared/icon";
import { toast } from "@/components/shared/toast";
import { Button } from "@/components/ui/button";
import { removePushSubscriptionAction, savePushSubscriptionAction } from "../actions";

type PushState =
  | "memeriksa"
  | "belum-tersedia"
  | "tidak-didukung"
  | "perlu-pasang"
  | "diblokir"
  | "mati"
  | "aktif";

const MESSAGES: Record<Exclude<PushState, "memeriksa" | "mati" | "aktif">, string> = {
  "belum-tersedia": "Notifikasi HP belum tersedia. Notifikasi tetap masuk ke lonceng dan email.",
  "tidak-didukung": "Browser ini belum mendukung notifikasi HP.",
  "perlu-pasang": "Di iPhone, pasang aplikasi ke layar utama dulu, lalu buka dari ikonnya.",
  diblokir: "Notifikasi diblokir. Izinkan dari pengaturan browser.",
};

function serverKey(base64url: string): Uint8Array<ArrayBuffer> {
  const base64 = (base64url + "=".repeat((4 - (base64url.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const raw = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let index = 0; index < raw.length; index += 1) bytes[index] = raw.charCodeAt(index);
  return bytes;
}

function needsInstall(): boolean {
  const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && navigator.standalone === true);
  return ios && !standalone;
}

export function PushSetup({ publicKey }: { publicKey: string | null }) {
  const [state, setState] = useState<PushState>("memeriksa");
  const [busy, setBusy] = useState(false);
  const save = useAction(savePushSubscriptionAction);
  const remove = useAction(removePushSubscriptionAction);

  useEffect(() => {
    let active = true;
    const settle = (next: PushState) => {
      if (active) setState(next);
    };
    if (!publicKey) settle("belum-tersedia");
    else if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      settle(needsInstall() ? "perlu-pasang" : "tidak-didukung");
    } else if (Notification.permission === "denied") settle("diblokir");
    else {
      void navigator.serviceWorker.ready
        .then((registration) => registration.pushManager.getSubscription())
        .then((subscription) => {
          settle(subscription ? "aktif" : "mati");
        })
        .catch(() => {
          settle("mati");
        });
    }
    return () => {
      active = false;
    };
  }, [publicKey]);

  async function enable() {
    if (!publicKey) return;
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "diblokir" : "mati");
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: serverKey(publicKey),
        }));
      const json = subscription.toJSON();
      const result = await save.executeAsync({
        endpoint: subscription.endpoint,
        p256dh: json.keys?.p256dh ?? "",
        auth: json.keys?.auth ?? "",
      });
      if (!result.data) throw new Error("save");
      setState("aktif");
      toast.success("Notifikasi HP aktif.");
    } catch {
      toast.error("Notifikasi HP gagal diaktifkan. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await remove.executeAsync({ endpoint: subscription.endpoint });
        await subscription.unsubscribe();
      }
      setState("mati");
      toast.success("Notifikasi HP dimatikan.");
    } catch {
      toast.error("Notifikasi HP gagal dimatikan. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  if (state === "memeriksa") {
    return <div aria-hidden="true" className="h-11 animate-pulse rounded-lg bg-neutral-100" />;
  }
  if (state === "aktif") {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-success-50 p-4 text-success-900 dark:bg-success-950 dark:text-success-100">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Icon icon={Notification03Icon} size={18} />
          Notifikasi HP aktif di perangkat ini
        </p>
        <Button
          type="button"
          size="sm"
          variant="cancel"
          disabled={busy}
          onClick={() => void disable()}
        >
          Matikan
        </Button>
      </div>
    );
  }
  if (state === "mati") {
    return (
      <Button type="button" variant="save" disabled={busy} onClick={() => void enable()}>
        <Icon icon={Notification03Icon} size={18} />
        Aktifkan notifikasi HP
      </Button>
    );
  }
  return (
    <p className="flex items-start gap-2 rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-700 dark:bg-neutral-900 dark:text-neutral-200">
      <Icon icon={NotificationOff01Icon} size={18} className="mt-0.5" />
      {MESSAGES[state]}
    </p>
  );
}
