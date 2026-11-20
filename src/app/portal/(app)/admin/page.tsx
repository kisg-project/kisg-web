import type { Metadata } from "next";
import { ModulePlaceholder } from "../_components/module-placeholder";

export const metadata: Metadata = { title: "Admin" };

export default function AdminPage() {
  return <ModulePlaceholder prefix="/portal/admin" phase="Fase 2b (pengguna) dan Fase 4 (CMS)" />;
}
