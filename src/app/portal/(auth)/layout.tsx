import { AuthScene } from "@/components/shared/auth-scene";

export default function PortalAuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthScene label="KIS Operasional">{children}</AuthScene>;
}
