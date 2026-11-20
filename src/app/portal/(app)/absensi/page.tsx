import type { Metadata } from "next";
import { ModulePlaceholder } from "../_components/module-placeholder";

export const metadata: Metadata = { title: "Absensi" };

export default function AbsensiPage() {
  return <ModulePlaceholder prefix="/portal/absensi" phase="Fase 8" />;
}
