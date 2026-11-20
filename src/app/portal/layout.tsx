import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { PwaRegister } from "@/features/pwa";

// Portal internal tidak diindeks mesin pencari (CLAUDE.md bagian 6). Juga diblokir di robots.txt.
export const metadata: Metadata = {
  title: { default: "KIS Group Operasional", template: "%s | KIS Operasional" },
  robots: { index: false, follow: false, nocache: true },
  // PWA: bisa dipasang di HP (manifest mengikuti host, lihat manifest.webmanifest/route.ts).
  manifest: "/portal/manifest.webmanifest",
  applicationName: "KIS Group Operasional",
  appleWebApp: { capable: true, title: "KIS Operasional", statusBarStyle: "default" },
  icons: { icon: "/favicon.ico", apple: "/brand/apple-touch-icon.png" },
};

export default function PortalLayout({ children }: LayoutProps<"/portal">) {
  return (
    <>
      {children}
      <Toaster position="top-center" />
      <PwaRegister />
    </>
  );
}
