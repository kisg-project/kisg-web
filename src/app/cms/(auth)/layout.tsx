import { AuthScene } from "@/components/shared/auth-scene";

export default function CmsAuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthScene label="Panel CMS">{children}</AuthScene>;
}
