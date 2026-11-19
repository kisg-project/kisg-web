import type { Metadata } from "next";
import { ModulePlaceholder } from "../_components/module-placeholder";

export const metadata: Metadata = { title: "Dashboard owner" };

export default function OwnerPage() {
  return <ModulePlaceholder prefix="/portal/owner" phase="Fase 8" />;
}
