import type { Metadata } from "next";
import { ModulePlaceholder } from "../_components/module-placeholder";

export const metadata: Metadata = { title: "CRM" };

export default function CrmPage() {
  return <ModulePlaceholder prefix="/portal/crm" />;
}
