import { z } from "zod";
import { CAREER_LEVELS } from "@/config/careers";
// Impor langsung ke skema blok (bukan index fitur cms), karena index itu juga mengekspor query
// server-only yang tidak boleh ikut ke komponen client. Berkas ini hanya berisi zod dan tipe.
import { contentBlockSchema } from "@/features/cms/utils/map";
import { SLUG_PATTERN } from "../utils/slug";

const title = z
  .string({ error: "Isi judul." })
  .trim()
  .min(5, "Judul minimal 5 karakter.")
  .max(140, "Judul maksimal 140 karakter.");

const slug = z
  .string({ error: "Isi slug." })
  .trim()
  .min(3, "Slug minimal 3 karakter.")
  .max(80, "Slug maksimal 80 karakter.")
  .regex(
    SLUG_PATTERN,
    "Slug hanya huruf kecil, angka, dan tanda hubung. Contoh: promo-akhir-tahun.",
  );

const status = z.enum(["draft", "terbit"], { error: "Pilih status." });
/** Teks opsional. String kosong diubah menjadi null di server action (tanpa transform, supaya tipe
 * form dan tipe input aksi sama). */
const optionalText = (max: number, message: string) =>
  z.string().trim().max(max, message).optional();

export const postSchema = z
  .object({
    id: z.uuid().optional(),
    title,
    slug,
    excerpt: z
      .string({ error: "Isi ringkasan." })
      .trim()
      .min(20, "Ringkasan minimal 20 karakter.")
      .max(160, "Ringkasan maksimal 160 karakter (dipakai sebagai deskripsi mesin pencari)."),
    coverPath: z.string().max(500, "Alamat sampul terlalu panjang.").nullable().optional(),
    coverAlt: optionalText(160, "Teks alternatif maksimal 160 karakter."),
    body: z.array(contentBlockSchema).min(1, "Isi berita minimal satu paragraf."),
    status,
  })
  .refine((value) => !value.coverPath || Boolean(value.coverAlt), {
    path: ["coverAlt"],
    message: "Isi teks alternatif sampul (dibaca pembaca layar dan mesin pencari).",
  });

const levelValues = CAREER_LEVELS.map((item) => item.level) as [
  (typeof CAREER_LEVELS)[number]["level"],
  ...(typeof CAREER_LEVELS)[number]["level"][],
];

export const careerSchema = z.object({
  id: z.uuid().optional(),
  title,
  slug,
  department: optionalText(80, "Divisi maksimal 80 karakter."),
  location: optionalText(80, "Lokasi maksimal 80 karakter."),
  employmentType: optionalText(40, "Jenis pekerjaan maksimal 40 karakter."),
  level: z.enum(levelValues, { error: "Pilih jenjang." }),
  closesOn: z
    .union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid.")])
    .optional(),
  description: z.array(contentBlockSchema).min(1, "Isi deskripsi pekerjaan minimal satu paragraf."),
  requirements: z
    .array(z.string().trim().min(1).max(200, "Satu syarat maksimal 200 karakter."))
    .max(30, "Maksimal 30 syarat."),
  status,
});

export const deleteSchema = z.object({ id: z.uuid() });

export type PostInput = z.input<typeof postSchema>;
export type CareerInput = z.input<typeof careerSchema>;
