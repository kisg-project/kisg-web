import { AuthScene } from "@/components/shared/auth-scene";

/** Aktivasi akun: satu tugas di layar, tanpa menu portal. */
export default function PortalSetupLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthScene label="KIS Operasional" wide>
      {children}
    </AuthScene>
  );
}
