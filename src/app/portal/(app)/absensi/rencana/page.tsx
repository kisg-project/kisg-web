import type { Metadata } from "next";
import { WorkReportPage } from "../_components/work-report-page";

export const metadata: Metadata = { title: "Rencana kegiatan" };

export default function Page() {
  return <WorkReportPage kind="rencana" />;
}
