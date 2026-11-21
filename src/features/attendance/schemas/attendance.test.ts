import { describe, expect, it } from "vitest";
import { mustAttend } from "@/config/attendance";
import { workReportSchema } from "./attendance";

const USER = "00000000-0000-4000-8000-000000000902";
const photo = {
  path: `${USER}/2026-11-22/foto-1.webp`,
  name: "foto.webp",
  type: "image/webp",
  size: 1200,
};

describe("workReportSchema", () => {
  it("menerima rencana dengan lampiran milik folder user", () => {
    const parsed = workReportSchema.parse({
      kind: "rencana",
      content: "  Follow up calon pembeli.  ",
      attachments: [photo],
    });
    expect(parsed.content).toBe("Follow up calon pembeli.");
  });

  it("menolak isi di bawah 10 karakter", () => {
    const result = workReportSchema.safeParse({
      kind: "hasil",
      content: "pendek",
      attachments: [],
    });
    expect(result.error?.issues[0]?.message).toBe("Tulis minimal 10 karakter.");
  });

  it("menolak path lampiran di luar pola folder dan jenis file", () => {
    for (const path of ["../rahasia.pdf", `${USER}/2026-11-22/skrip.exe`, `${USER}/a.webp`]) {
      const result = workReportSchema.safeParse({
        kind: "rencana",
        content: "Follow up calon pembeli.",
        attachments: [{ ...photo, path }],
      });
      expect(result.success, path).toBe(false);
    }
  });

  it("menolak lebih dari 10 lampiran", () => {
    const result = workReportSchema.safeParse({
      kind: "rencana",
      content: "Follow up calon pembeli.",
      attachments: Array.from({ length: 11 }, () => photo),
    });
    expect(result.error?.issues[0]?.message).toBe("Lampiran maksimal 10 file.");
  });
});

describe("mustAttend", () => {
  it("karyawan wajib, owner tidak, akun cms tidak", () => {
    expect(mustAttend(["marketing"])).toBe(true);
    expect(mustAttend(["finance", "owner"])).toBe(false);
    expect(mustAttend(["cms"])).toBe(false);
  });
});
