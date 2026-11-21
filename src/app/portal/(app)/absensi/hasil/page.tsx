import type { Metadata } from "next";
import { WorkReportPage } from "../_components/work-report-page";

export const metadata: Metadata = { title: "Hasil kerja" };

export default function Page() {
  return <WorkReportPage kind="hasil" />;
}
