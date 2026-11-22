/** Sapaan sesuai jam di Asia/Jakarta (WIB), dipakai di beranda portal. */
export type Greeting = "Selamat pagi" | "Selamat siang" | "Selamat sore" | "Selamat malam";

export function greetingFor(at: Date = new Date()): Greeting {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      hourCycle: "h23",
      timeZone: "Asia/Jakarta",
    }).format(at),
  );
  if (hour >= 4 && hour < 11) return "Selamat pagi";
  if (hour >= 11 && hour < 15) return "Selamat siang";
  if (hour >= 15 && hour < 18) return "Selamat sore";
  return "Selamat malam";
}

/**
 * Nama untuk sapaan di beranda portal: dua kata pertama (keputusan owner, 22 November 2026, satu kata
 * terlalu pendek). Gelar di depan (Ir., Dr., H., Hj.) dilewati supaya sapaan memakai nama orangnya.
 */
export function greetingName(fullName: string): string {
  const words = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.replace(/[,.]+$/, ""));
  const start = words.findIndex((word) => !/^(ir|dr|drs|dra|h|hj|prof)$/i.test(word));
  return words.slice(start === -1 ? 0 : start, (start === -1 ? 0 : start) + 2).join(" ");
}
