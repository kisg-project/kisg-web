// Aturan copywriting CLAUDE.md bagian 7 yang bisa diperiksa mesin.
// Pola "tiga kata sifat berjejer" dan "pertanyaan retoris pembuka" tidak bisa dideteksi andal,
// jadi tetap lewat review manual.

/** Penanda pengecualian per baris. Wajib diikuti alasan, misal: check-copy: allow test filter output */
export const ALLOW_MARKER = /check-copy:\s*allow\s+\S+/;

const DASH = /[–—]/g;

// Emoji dan simbol bergambar. Simbol legal (c), (r), dan TM tetap boleh.
const PICTOGRAPHIC = /\p{Extended_Pictographic}/gu;
const ALLOWED_SYMBOLS = new Set(["©", "®", "™"]);

const FORBIDDEN_ICONS = [
  "Sparkles",
  "Sparkle",
  "SparklesIcon",
  "SparkleIcon",
  "WandSparkles",
  "WandSparklesIcon",
  "Wand",
  "Wand2",
  "WandIcon",
  "Stars",
  "Bot",
  "BotIcon",
  "BotMessageSquare",
  "BotOff",
];

const LUCIDE_IMPORT = /import\s+(?:type\s+)?\{([^}]*)\}\s*from\s*["']lucide-react["']/g;
const LUCIDE_PATH_IMPORT =
  /from\s*["']lucide-react\/(?:dist\/esm\/)?icons\/(sparkle|wand|stars|bot)[^"']*["']/gi;

// Frasa klise (tanpa beda huruf besar kecil). Ditulis tanpa variasi imbuhan, cukup inti frasanya.
export const CLICHE_PHRASES = [
  "wujudkan hunian impian",
  "lebih dari sekadar rumah",
  "di era modern ini",
  "hadir sebagai solusi",
  "nikmati pengalaman",
  "rasakan sensasi",
  "dengan bangga mempersembahkan",
  "selamat datang di",
  "mari bersama",
  "tak hanya itu",
  "dirancang khusus untuk anda",
  "solusi terbaik",
  "kenyamanan maksimal",
  "hunian idaman yang anda dambakan",
  "inovatif",
  "seamless",
  "elevate",
  "unlock",
  "next level",
  "game changer",
];

// Nama resmi yang kebetulan memuat kata terlarang.
const ALLOWED_PROPER_NAMES = [/kreatif\s+inovatif\s+sejahtera/gi];

const NOT_ONLY_BUT_ALSO = /\bbukan hanya\b.{0,80}?\btetapi juga\b/gi;
const MULTI_EXCLAMATION = /!{2,}/g;

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const PHRASE_PATTERNS = CLICHE_PHRASES.map((phrase) => ({
  phrase,
  regex: new RegExp(`(?<![\\p{L}\\p{N}_])${escapeRegExp(phrase)}(?![\\p{L}\\p{N}_])`, "giu"),
}));

/**
 * @typedef {{ line: number, column: number, rule: string, message: string }} CopyIssue
 */

/**
 * @param {string} text isi file
 * @param {{ isCode?: boolean }} [options] isCode: file kode (ts, tsx, js). Tanda seru ganda tidak diperiksa di kode.
 * @returns {CopyIssue[]}
 */
export function findCopyIssues(text, options = {}) {
  const { isCode = false } = options;
  /** @type {CopyIssue[]} */
  const issues = [];
  const lines = text.split(/\r?\n/);

  lines.forEach((rawLine, index) => {
    const previous = index > 0 ? (lines[index - 1] ?? "") : "";
    if (ALLOW_MARKER.test(rawLine) || ALLOW_MARKER.test(previous)) return;

    const lineNumber = index + 1;
    let line = rawLine;
    for (const allowed of ALLOWED_PROPER_NAMES) {
      line = line.replace(allowed, (match) => " ".repeat(match.length));
    }

    for (const match of line.matchAll(DASH)) {
      issues.push({
        line: lineNumber,
        column: (match.index ?? 0) + 1,
        rule: "dash",
        message: "Tanda pisah panjang. Pakai titik, koma, atau titik dua.",
      });
    }

    for (const match of line.matchAll(PICTOGRAPHIC)) {
      if (ALLOWED_SYMBOLS.has(match[0])) continue;
      issues.push({
        line: lineNumber,
        column: (match.index ?? 0) + 1,
        rule: "emoji",
        message: "Emoji atau simbol dekoratif tidak boleh dipakai.",
      });
    }

    for (const { phrase, regex } of PHRASE_PATTERNS) {
      for (const match of line.matchAll(regex)) {
        issues.push({
          line: lineNumber,
          column: (match.index ?? 0) + 1,
          rule: "cliche",
          message: `Frasa klise "${phrase}".`,
        });
      }
    }

    for (const match of line.matchAll(NOT_ONLY_BUT_ALSO)) {
      issues.push({
        line: lineNumber,
        column: (match.index ?? 0) + 1,
        rule: "cliche",
        message: 'Pola "bukan hanya ... tetapi juga".',
      });
    }

    if (!isCode) {
      for (const match of line.matchAll(MULTI_EXCLAMATION)) {
        issues.push({
          line: lineNumber,
          column: (match.index ?? 0) + 1,
          rule: "exclamation",
          message: "Tanda seru beruntun.",
        });
      }
    }
  });

  if (isCode) issues.push(...findForbiddenIcons(text));

  return issues.sort((a, b) => a.line - b.line || a.column - b.column);
}

/**
 * @param {string} text
 * @returns {CopyIssue[]}
 */
export function findForbiddenIcons(text) {
  /** @type {CopyIssue[]} */
  const issues = [];
  const lineOf = (offset) => text.slice(0, offset).split(/\r?\n/).length;

  for (const match of text.matchAll(LUCIDE_IMPORT)) {
    const specifiers = (match[1] ?? "")
      .split(",")
      .map(
        (part) =>
          part
            .trim()
            .split(/\s+as\s+/)[0]
            ?.trim() ?? "",
      )
      .filter(Boolean);
    for (const name of specifiers) {
      if (FORBIDDEN_ICONS.includes(name)) {
        issues.push({
          line: lineOf(match.index ?? 0),
          column: 1,
          rule: "icon",
          message: `Ikon "${name}" dilarang (CLAUDE.md bagian 3).`,
        });
      }
    }
  }

  for (const match of text.matchAll(LUCIDE_PATH_IMPORT)) {
    issues.push({
      line: lineOf(match.index ?? 0),
      column: 1,
      rule: "icon",
      message: "Ikon sparkles, wand, stars, atau bot dilarang (CLAUDE.md bagian 3).",
    });
  }

  return issues;
}
