import type { Metadata } from "next";
import { ModulePlaceholder } from "../_components/module-placeholder";

export const metadata: Metadata = { title: "Marketing" };

export default function MarketingPage() {
  return <ModulePlaceholder prefix="/portal/marketing" />;
}
