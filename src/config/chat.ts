// Widget customer service "Jaka" (CLAUDE.md bagian 12, keputusan owner 21 November 2026).

export const CHAT_ASSISTANT = {
  name: "Jaka",
  role: "Asisten virtual KIS Group",
} as const;

export const CHAT_LIMITS = {
  /** Panjang maksimal satu pesan pengunjung. */
  maxMessageChars: 500,
  /** Batas pesan pengunjung per sesi. Setelah itu ditawarkan lanjut lewat WhatsApp. */
  maxMessagesPerSession: 40,
  /** Batas pesan per IP per jam. */
  messagesPerIpPerHour: 60,
  /** Jumlah pesan terakhir yang dikirim ke model sebagai riwayat. */
  historyMessages: 16,
  /** Batas token jawaban (sudah termasuk proses berpikir model). */
  maxOutputTokens: 1200,
} as const;

export const CHAT_GREETING =
  "Halo, saya Jaka, asisten virtual KIS Group. Saya bisa bantu soal rumah di Sejahtera Green Village, harga, simulasi cicilan KPR, dan jadwal survei.";

export const CHAT_SUGGESTIONS = [
  "Berapa harga rumahnya?",
  "Hitung cicilan KPR",
  "Lokasinya di mana?",
  "Saya mau survei lokasi",
] as const;

/** Jawaban saat Jaka tidak bisa membalas (kuota, gangguan, batas). Tidak pernah pesan error teknis. */
export const CHAT_UNAVAILABLE =
  "Maaf, Jaka sedang tidak bisa membalas saat ini. Silakan lanjut lewat WhatsApp, marketing kami siap membantu.";

export const CHAT_LIMIT_REACHED =
  "Percakapan ini sudah cukup panjang. Supaya lebih cepat, lanjutkan dengan marketing kami lewat WhatsApp.";
