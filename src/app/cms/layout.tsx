import type { Metadata } from "next";
import { AppFrame } from "@/components/shared/app-frame";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: { default: "Panel CMS KIS Group", template: "%s | CMS KIS Group" },
  robots: { index: false, follow: false, nocache: true },
};

export default function CmsLayout({ children }: LayoutProps<"/cms">) {
  return (
    <AppFrame>
      {children}
      <Toaster position="top-center" />
    </AppFrame>
  );
}
