import type { Metadata } from "next";
import { Work_Sans } from "next/font/google";
import { BodyClass } from "@/components/shared/body-class";
import { Toaster } from "@/components/ui/sonner";
import { PwaRegister } from "@/features/pwa";

const PREFERENCES = `try{var r=document.documentElement,s=localStorage;if(s.getItem("kis-tema")==="gelap")r.setAttribute("data-tema","gelap");if(s.getItem("kis-rel")==="lebar")r.setAttribute("data-rel","lebar")}catch(e){}`;

const workSans = Work_Sans({ variable: "--font-work-sans", subsets: ["latin"], display: "swap" });

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
    <div className={workSans.variable}>
      <script dangerouslySetInnerHTML={{ __html: PREFERENCES }} />
      <BodyClass className={workSans.variable} />
      {children}
      <Toaster position="top-center" />
      <PwaRegister />
    </div>
  );
}
