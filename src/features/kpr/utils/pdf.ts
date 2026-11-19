// PDF simulasi KPR berkop KIS (CLAUDE.md bagian 6, ekspor PDF: header dan footer di setiap halaman).
// jsPDF dan autotable dimuat hanya saat tombol unduh diklik, supaya halaman tetap ringan.

import { formatDateTimeWIB, formatRupiah } from "@/lib/format";
import { formatOfficeAddress, siteConfig } from "@/config/site";
import type { KprScheme } from "@/config/kpr-products";
import type { KprTerms } from "../terms";
import type { CostResult } from "./costs";
import type { KprResult } from "./calculate";

export interface KprPdfData {
  scheme: KprScheme;
  terms: KprTerms;
  projectName: string;
  unitName: string;
  programName: string;
  price: number;
  downPayment: number;
  tenorYears: number;
  npoptkp: number;
  otherCostsPercent: number;
  includedCosts: readonly string[];
  result: KprResult;
  costs: CostResult;
  generatedAt: Date;
}

const PAGE = { width: 210, height: 297, margin: 15 };
const COLOR = {
  primary: [15, 109, 95] as const,
  gold: [215, 174, 95] as const,
  text: [45, 53, 51] as const,
  muted: [87, 96, 94] as const,
  stripe: [241, 249, 247] as const,
};
const LOGO = { width: 32, height: 32 * (572 / 966) };

function percent(value: number): string {
  return `${value.toLocaleString("id-ID", { maximumFractionDigits: 2 })}%`;
}

async function logoDataUrl(): Promise<string> {
  const response = await fetch(siteConfig.logo.src);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Logo gagal dibaca."));
    };
    reader.onerror = () => {
      reject(new Error("Logo gagal dimuat."));
    };
    reader.readAsDataURL(blob);
  });
}

export function kprPdfFileName(scheme: KprScheme): string {
  return `simulasi-kpr-${scheme}-sejahtera-green-village.pdf`;
}

export async function downloadKprPdf(data: KprPdfData): Promise<void> {
  const [{ jsPDF }, { autoTable }, logo] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
    logoDataUrl(),
  ]);
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: false });
  const { terms } = data;
  const right = PAGE.width - PAGE.margin;
  const generated = formatDateTimeWIB(data.generatedAt);
  let cursorY = 0;

  const tableBase = {
    margin: { top: 30, bottom: 20, left: PAGE.margin, right: PAGE.margin },
    theme: "grid" as const,
    showHead: "everyPage" as const,
    styles: {
      fontSize: 8.5,
      cellPadding: 1.8,
      textColor: [...COLOR.text] as [number, number, number],
      lineColor: [212, 219, 217] as [number, number, number],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [...COLOR.primary] as [number, number, number],
      textColor: [255, 255, 255] as [number, number, number],
      fontStyle: "bold" as const,
    },
    alternateRowStyles: { fillColor: [...COLOR.stripe] as [number, number, number] },
    didDrawPage: (hook: { cursor: { y: number } | null }) => {
      if (hook.cursor) cursorY = hook.cursor.y;
    },
  };

  const heading = (text: string) => {
    if (cursorY > PAGE.height - 45) {
      doc.addPage();
      cursorY = 30;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...COLOR.primary);
    doc.text(text, PAGE.margin, cursorY + 8);
    cursorY += 11;
  };

  // Kop lengkap halaman pertama.
  doc.addImage(logo, "PNG", PAGE.margin, 10, LOGO.width, LOGO.height);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...COLOR.text);
  doc.text(siteConfig.legalName, right, 14, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...COLOR.muted);
  const addressLines = doc.splitTextToSize(formatOfficeAddress(), 120) as string[];
  doc.text(addressLines, right, 19, { align: "right" });
  doc.text(
    `WhatsApp ${siteConfig.whatsapp.display}  |  Instagram ${siteConfig.instagram.handle}  |  ${siteConfig.domain}`,
    right,
    19 + addressLines.length * 3.6,
    { align: "right" },
  );
  doc.setDrawColor(...COLOR.gold);
  doc.setLineWidth(0.8);
  doc.line(PAGE.margin, 33, right, 33);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...COLOR.text);
  doc.text(`Simulasi ${terms.title}`, PAGE.margin, 43);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...COLOR.muted);
  doc.text(`${data.projectName}, ${data.unitName}. Program: ${data.programName}.`, PAGE.margin, 49);
  cursorY = 52;

  heading("Data simulasi");
  autoTable(doc, {
    ...tableBase,
    startY: cursorY,
    head: [["Keterangan", "Nilai"]],
    body: [
      ["Harga rumah", formatRupiah(data.price)],
      [
        `Uang muka (${percent((data.downPayment / data.price) * 100)})`,
        formatRupiah(data.downPayment),
      ],
      [terms.principal, formatRupiah(data.result.loanAmount)],
      [terms.tenor, `${data.tenorYears} tahun (${data.result.months} bulan)`],
    ],
    columnStyles: { 1: { halign: "right" } },
  });

  heading(`${terms.installment} per bulan`);
  autoTable(doc, {
    ...tableBase,
    startY: cursorY,
    head: [["Periode", terms.rate, `${terms.installment} per bulan`]],
    body: data.result.periods.map((period) => [
      `Bulan ${period.fromMonth} sampai ${period.toMonth}${period.isAfter && data.result.periods.length > 1 ? " (asumsi)" : ""}`,
      `${percent(period.ratePercent)} per tahun`,
      formatRupiah(period.monthly),
    ]),
    foot: [
      [terms.totalInterest, "", formatRupiah(data.result.totalInterest)],
      [terms.totalPayment, "", formatRupiah(data.result.totalPayment)],
    ],
    footStyles: { fillColor: [231, 239, 237], textColor: [...COLOR.text], fontStyle: "bold" },
    columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } },
  });

  heading("Rincian biaya");
  autoTable(doc, {
    ...tableBase,
    startY: cursorY,
    head: [["Biaya", "Keterangan", "Jumlah"]],
    body: [
      ...data.includedCosts.map((item) => [item, "Sudah termasuk harga rumah", "Rp 0"]),
      [
        "BPHTB",
        `5% x (harga - NPOPTKP ${formatRupiah(data.npoptkp)})`,
        formatRupiah(data.costs.bphtb),
      ],
      [
        "Biaya bank, notaris bank, asuransi",
        `Perkiraan ${percent(data.otherCostsPercent)} dari ${terms.principal.toLowerCase()}`,
        formatRupiah(data.costs.otherCosts),
      ],
    ],
    foot: [
      ["Uang muka", "", formatRupiah(data.downPayment)],
      ["Perkiraan dana awal (uang muka + biaya)", "", formatRupiah(data.costs.firstPayment)],
    ],
    footStyles: { fillColor: [231, 239, 237], textColor: [...COLOR.text], fontStyle: "bold" },
    columnStyles: { 2: { halign: "right" } },
  });

  heading(`Jadwal ${terms.installmentLower} per tahun`);
  autoTable(doc, {
    ...tableBase,
    startY: cursorY,
    head: [
      ["Tahun", `${terms.installment}/bulan`, "Pokok dibayar", terms.interestPaid, "Sisa pokok"],
    ],
    body: data.result.yearly.map((row) => [
      String(row.year),
      formatRupiah(row.monthly),
      formatRupiah(row.principalPaid),
      formatRupiah(row.interestPaid),
      formatRupiah(row.endingBalance),
    ]),
    columnStyles: {
      0: { halign: "center" },
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
    },
  });

  heading(`Jadwal ${terms.installmentLower} per bulan`);
  autoTable(doc, {
    ...tableBase,
    startY: cursorY,
    head: [["Bulan", terms.rate, terms.installment, "Pokok", terms.interestPaid, "Sisa pokok"]],
    body: data.result.schedule.map((row) => [
      String(row.month),
      percent(row.ratePercent),
      formatRupiah(Math.round(row.payment)),
      formatRupiah(Math.round(row.principal)),
      formatRupiah(Math.round(row.interest)),
      formatRupiah(Math.round(row.balance)),
    ]),
    styles: { ...tableBase.styles, fontSize: 7.5, cellPadding: 1.2 },
    columnStyles: {
      0: { halign: "center" },
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right" },
    },
  });

  heading("Catatan");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...COLOR.muted);
  const notes = doc.splitTextToSize(
    `Simulasi ini bersifat estimasi dan bukan penawaran bank. ${terms.schemeNote} Persetujuan, ${terms.rateLower}, dan biaya akhir mengikuti ketentuan bank. Hubungi marketing ${siteConfig.name} di WhatsApp ${siteConfig.whatsapp.display} untuk penawaran terbaru.`,
    PAGE.width - PAGE.margin * 2,
  ) as string[];
  doc.text(notes, PAGE.margin, cursorY + 2);

  // Kop ringkas (halaman 2 dan seterusnya) dan footer di setiap halaman.
  const total = doc.getNumberOfPages();
  for (let page = 1; page <= total; page += 1) {
    doc.setPage(page);
    if (page > 1) {
      doc.addImage(logo, "PNG", PAGE.margin, 8, 20, 20 * (572 / 966));
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...COLOR.text);
      doc.text(`Simulasi ${terms.title}`, right, 13, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...COLOR.muted);
      doc.text(`${siteConfig.legalName}  |  ${data.projectName}`, right, 18, { align: "right" });
      doc.setDrawColor(...COLOR.gold);
      doc.setLineWidth(0.5);
      doc.line(PAGE.margin, 23, right, 23);
    }
    doc.setDrawColor(212, 219, 217);
    doc.setLineWidth(0.2);
    doc.line(PAGE.margin, PAGE.height - 14, right, PAGE.height - 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...COLOR.muted);
    doc.text(`${siteConfig.legalName}  |  Dibuat ${generated}`, PAGE.margin, PAGE.height - 9);
    doc.text(`Halaman ${page} dari ${total}`, right, PAGE.height - 9, { align: "right" });
  }

  doc.save(kprPdfFileName(data.scheme));
}
