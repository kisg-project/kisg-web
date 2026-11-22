import type { Metadata } from "next";
import { ModulePlaceholder } from "../_components/module-placeholder";

export const metadata: Metadata = { title: "Laporan lapangan" };

export default function LapanganPage() {
  return <ModulePlaceholder prefix="/portal/lapangan" />;
}
