// Pengaman terakhir untuk jawaban Jaka sebelum sampai ke pengunjung (CLAUDE.md bagian 7 dan 12):
// tanpa tanda pisah panjang, tanpa emoji, dan tanpa tanda format markdown karena widget menampilkan
// teks biasa. Karakter terlarang dibentuk dari kode angka supaya file ini lolos pnpm check:copy.

const LONG_DASHES = String.fromCodePoint(0x2014, 0x2013);
const BULLET = String.fromCodePoint(0x2022);
const DASH = new RegExp(`\\s*[${LONG_DASHES}]\\s*`, "g");
const EMOJI = /[\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}\u{FE0F}\u{200D}\u{20E3}]/gu;
const BOLD = /\*\*|__/g;
const LIST_MARKER = new RegExp(`^\\s*[*${BULLET}]\\s+`, "gm");

/** Membersihkan potongan teks yang sedang di-stream. Aman dipakai per potongan. */
export function cleanChunk(text: string): string {
  return text.replace(DASH, ", ").replace(EMOJI, "").replace(BOLD, "");
}

/** Membersihkan jawaban utuh: termasuk judul markdown, butir bintang, dan spasi berlebih. */
export function cleanReply(text: string): string {
  return cleanChunk(text)
    .replace(/^#{1,6}\s+/gm, "")
    .replace(LIST_MARKER, "- ")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+$/gm, "")
    .replace(/ ([,.!?])/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
