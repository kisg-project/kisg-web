/** Sapaan sesuai jam di Asia/Jakarta (WIB), dipakai di beranda portal. */
export function greetingFor(at: Date = new Date()): string {
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
 * Nama depan untuk sapaan singkat di beranda portal. Gelar di depan (Ir., Dr., H., Hj.) dilewati
 * supaya sapaan tetap memakai nama orangnya.
 */
export function firstName(fullName: string): string {
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  const name = words.find((word) => !/^(ir|dr|drs|dra|h|hj|prof)\.?$/i.test(word));
  return (name ?? words[0] ?? "").replace(/[,.]+$/, "");
}
