import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";

// Panel CMS tidak diindeks mesin pencari dan diblokir di robots.txt.
export const metadata: Metadata = {
  title: { default: "Panel CMS KIS Group", template: "%s | CMS KIS Group" },
  robots: { index: false, follow: false, nocache: true },
};

export default function CmsLayout({ children }: LayoutProps<"/cms">) {
  return (
    <>
      {children}
      <Toaster position="top-center" />
    </>
  );
}
