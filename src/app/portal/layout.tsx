import type { Metadata } from "next";
import { AppFrame } from "@/components/shared/app-frame";
import { Toaster } from "@/components/ui/sonner";
import { PwaRegister } from "@/features/pwa";

export const metadata: Metadata = {
  title: { default: "KIS Group Operasional", template: "%s | KIS Operasional" },
  robots: { index: false, follow: false, nocache: true },
  manifest: "/portal/manifest.webmanifest",
  applicationName: "KIS Group Operasional",
  appleWebApp: { capable: true, title: "KIS Operasional", statusBarStyle: "default" },
  icons: { icon: "/favicon.ico", apple: "/brand/apple-touch-icon.png" },
};

export default function PortalLayout({ children }: LayoutProps<"/portal">) {
  return (
    <AppFrame>
      {children}
      <Toaster position="top-center" />
      <PwaRegister />
    </AppFrame>
  );
}
