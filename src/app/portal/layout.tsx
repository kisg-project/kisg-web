import type { Metadata } from "next";

// Portal internal tidak diindeks mesin pencari (CLAUDE.md bagian 6). Juga diblokir di robots.txt.
export const metadata: Metadata = {
  title: { default: "Portal KIS Group", template: "%s | Portal KIS Group" },
  robots: { index: false, follow: false, nocache: true },
};

export default function PortalLayout({ children }: LayoutProps<"/portal">) {
  return children;
}
