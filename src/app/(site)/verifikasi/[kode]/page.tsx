import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { Container } from "@/components/shared/container";
import { APPROVAL_DECISION_LABEL, APPROVAL_DOC_LABEL } from "@/config/approvals";
import { ROLE_LABELS } from "@/config/roles";
import { siteConfig } from "@/config/site";
import { verifyApproval } from "@/features/approvals/server";
import { formatDateTimeWIB } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Verifikasi persetujuan digital",
  description:
    "Periksa keaslian cap persetujuan digital pada dokumen PT Kreatif Inovatif Sejahtera Group.",
  robots: { index: false, follow: false },
};

/**
 * Halaman verifikasi dari QR code pada dokumen. Isi dokumen dihitung ulang di database: kalau berubah
 * setelah diputuskan, cap dinyatakan tidak cocok. Kode tidak dikenal: 404.
 */
export default async function VerificationPage({ params }: PageProps<"/verifikasi/[kode]">) {
  const { kode } = await params;
  const result = await verifyApproval(kode);
  if (!result) notFound();
  const rows = [
    { label: "Dokumen", value: `${APPROVAL_DOC_LABEL[result.doc_type]}. ${result.document}` },
    ...(result.subject ? [{ label: "Karyawan", value: result.subject }] : []),
    { label: "Keputusan", value: APPROVAL_DECISION_LABEL[result.decision] },
    { label: "Oleh", value: `${result.signer_name} (${ROLE_LABELS[result.signer_role]})` },
    { label: "Waktu", value: `${formatDateTimeWIB(result.signed_at)} WIB` },
  ];

  return (
    <Container className="grid max-w-2xl gap-6 py-12 sm:py-16">
      <h1 className="text-3xl font-bold tracking-tight">Verifikasi persetujuan digital</h1>
      <div
        role="status"
        className={cn(
          "flex items-start gap-3 rounded-3xl p-5",
          result.matches ? "bg-success-50 text-success-800" : "bg-danger-50 text-danger-800",
        )}
      >
        {result.matches ? (
          <ShieldCheck aria-hidden="true" className="size-6 shrink-0" />
        ) : (
          <ShieldAlert aria-hidden="true" className="size-6 shrink-0" />
        )}
        <p className="font-semibold">
          {result.matches
            ? "Cap persetujuan asli. Isi dokumen sama dengan saat diputuskan."
            : "Tidak cocok. Isi dokumen berubah setelah diputuskan."}
        </p>
      </div>
      <dl className="grid gap-4 rounded-3xl border p-5 sm:p-6">
        {rows.map((row) => (
          <div key={row.label} className="grid gap-0.5 sm:grid-cols-[8rem_1fr] sm:gap-4">
            <dt className="text-sm text-subtle-foreground">{row.label}</dt>
            <dd className="font-semibold">{row.value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-sm text-subtle-foreground">
        Tanda tangan elektronik tidak tersertifikasi, diterbitkan oleh {siteConfig.legalName}.
      </p>
    </Container>
  );
}
