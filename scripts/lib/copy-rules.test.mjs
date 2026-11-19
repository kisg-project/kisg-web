import { describe, expect, it } from "vitest";
import { findCopyIssues, findForbiddenIcons } from "./copy-rules.mjs";

const EM_DASH = "—";
const EN_DASH = "–";
const ROCKET = "\u{1F680}";

describe("findCopyIssues", () => {
  it("menandai em dash dan en dash beserta posisinya", () => {
    const issues = findCopyIssues(`Rumah siap huni ${EM_DASH} dekat stasiun\nTipe 36${EN_DASH}72`);
    expect(issues.map((i) => [i.rule, i.line])).toEqual([
      ["dash", 1],
      ["dash", 2],
    ]);
    expect(issues[0]?.column).toBe(17);
  });

  it("menandai emoji tetapi membiarkan simbol hak cipta", () => {
    const issues = findCopyIssues(`Promo baru ${ROCKET}\n© 2026 KIS Group`);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ rule: "emoji", line: 1 });
  });

  it("menandai frasa klise tanpa beda huruf besar kecil", () => {
    const issues = findCopyIssues("Selamat Datang di website kami. Solusi terbaik untuk keluarga.");
    expect(issues.map((i) => i.message)).toEqual([
      'Frasa klise "selamat datang di".',
      'Frasa klise "solusi terbaik".',
    ]);
  });

  it("tidak menandai nama resmi PT yang memuat kata inovatif", () => {
    expect(findCopyIssues("PT Kreatif Inovatif Sejahtera Group")).toEqual([]);
    expect(findCopyIssues("Desain inovatif")).toHaveLength(1);
  });

  it("tidak menandai kata terlarang yang menjadi bagian identifier kode", () => {
    expect(findCopyIssues("const unlockedUnits = releaseUnit(id);", { isCode: true })).toEqual([]);
  });

  it("menandai pola bukan hanya tetapi juga", () => {
    const issues = findCopyIssues("Bukan hanya rumah, tetapi juga lingkungan.");
    expect(issues).toHaveLength(1);
  });

  it("menandai tanda seru beruntun di konten, tidak di kode", () => {
    expect(findCopyIssues("Promo terbatas!!")).toHaveLength(1);
    expect(findCopyIssues("const ok = !!value;", { isCode: true })).toEqual([]);
  });

  it("melewati baris dengan penanda pengecualian beralasan", () => {
    const text = `// check-copy: allow test filter output chat\nconst sample = "a ${EM_DASH} b";`;
    expect(findCopyIssues(text, { isCode: true })).toEqual([]);
  });

  it("penanda tanpa alasan tidak berlaku", () => {
    const text = `// check-copy: allow\nconst sample = "a ${EM_DASH} b";`;
    expect(findCopyIssues(text, { isCode: true })).toHaveLength(1);
  });
});

describe("findForbiddenIcons", () => {
  it("menandai impor ikon sparkles dan bot dari lucide-react", () => {
    const code = `import { Home, Sparkles, Bot as Robot } from "lucide-react";`;
    expect(findForbiddenIcons(code).map((i) => i.message)).toEqual([
      'Ikon "Sparkles" dilarang (CLAUDE.md bagian 3).',
      'Ikon "Bot" dilarang (CLAUDE.md bagian 3).',
    ]);
  });

  it("menandai impor ikon lewat path", () => {
    expect(findForbiddenIcons(`import X from "lucide-react/icons/wand-sparkles";`)).toHaveLength(1);
  });

  it("membiarkan ikon lain", () => {
    expect(findForbiddenIcons(`import { Phone, MapPin } from "lucide-react";`)).toEqual([]);
  });
});
