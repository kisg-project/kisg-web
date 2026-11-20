import { describe, expect, it } from "vitest";
import { applicationSchema, CV_MAX_BYTES, cvProblem, looksLikePdf } from "./application";
import { leadFormSchema } from "./lead";

describe("cvProblem", () => {
  it("menerima PDF sampai 2 MB", () => {
    expect(cvProblem({ name: "cv.pdf", type: "application/pdf", size: CV_MAX_BYTES })).toBeNull();
  });

  it("menolak file kosong, bukan PDF, atau terlalu besar", () => {
    expect(cvProblem(null)).toMatch(/Lampirkan CV/);
    expect(cvProblem({ name: "cv.docx", type: "application/msword", size: 10 })).toBe(
      "CV harus berformat PDF.",
    );
    expect(cvProblem({ name: "cv.pdf", type: "application/pdf", size: CV_MAX_BYTES + 1 })).toBe(
      "Ukuran CV maksimal 2 MB.",
    );
  });
});

describe("looksLikePdf", () => {
  it("memeriksa tanda %PDF di awal file", () => {
    expect(looksLikePdf(new TextEncoder().encode("%PDF-1.4"))).toBe(true);
    expect(looksLikePdf(new TextEncoder().encode("PK\u0003\u0004"))).toBe(false);
  });
});

describe("skema form", () => {
  it("lamaran wajib email dan persetujuan", () => {
    const base = { fullName: "Budi", phone: "081234567890", careerSlug: "marketing" };
    expect(
      applicationSchema.safeParse({ ...base, email: "budi@contoh.id", consent: true }).success,
    ).toBe(true);
    expect(applicationSchema.safeParse({ ...base, email: "", consent: true }).success).toBe(false);
    expect(
      applicationSchema.safeParse({ ...base, email: "budi@contoh.id", consent: false }).success,
    ).toBe(false);
  });

  it("lead menerima email kosong tetapi menolak format salah dan nomor luar negeri", () => {
    const base = {
      fullName: "Budi",
      phone: "081234567890",
      consent: true,
      formKind: "kontak" as const,
    };
    expect(leadFormSchema.safeParse({ ...base, email: "" }).success).toBe(true);
    expect(leadFormSchema.safeParse({ ...base, email: "budi@" }).success).toBe(false);
    expect(leadFormSchema.safeParse({ ...base, phone: "+1 415 555 0100" }).success).toBe(false);
  });
});
