import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { PRIVACY_POLICY_VERSION } from "@/config/legal";
// Impor langsung ke skema (bukan index fitur) supaya route handler tidak ikut memuat komponen client.
import { applicationSchema, cvProblem, looksLikePdf } from "@/features/leads/schemas/application";
import { clientIp, hashKey, hitRateLimit } from "@/lib/security/rate-limit";
import { verifyTurnstile } from "@/lib/security/turnstile";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { normalizePhoneID } from "@/lib/format";
import type { Database } from "@/lib/supabase/database.types";

type SubmissionStatus = Database["public"]["Enums"]["submission_status"];

function fail(message: string, status = 400, fieldErrors?: Record<string, string[]>) {
  return NextResponse.json({ ok: false, message, fieldErrors }, { status });
}

/**
 * Lamaran kerja dengan CV (PDF, maks 2 MB). Route handler, bukan server action, karena batas body
 * server action 1 MB. Pengaman: preview, honeypot, rate limit IP, Turnstile, validasi Zod, cek isi
 * file PDF. CV disimpan di bucket privat job-applications, dibaca owner/admin lewat signed URL.
 */
export async function POST(request: NextRequest) {
  if (process.env.VERCEL_ENV === "preview") {
    return fail("Form tidak aktif di preview.", 503);
  }
  const ip = await clientIp();
  const ipHash = hashKey(ip);
  const admin = createSupabaseAdminClient();
  const record = async (status: SubmissionStatus, jobApplicationId?: string) => {
    await admin.from("form_submissions").insert({
      form_kind: "karir",
      status,
      page_path: request.headers.get("referer")
        ? new URL(request.headers.get("referer") ?? "").pathname
        : null,
      ip_hash: ipHash,
      user_agent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
      job_application_id: jobApplicationId ?? null,
    });
  };

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("Data lamaran tidak terbaca. Coba kirim lagi.");
  }

  const parsed = applicationSchema.safeParse({
    fullName: form.get("fullName"),
    phone: form.get("phone"),
    email: form.get("email"),
    coverNote: form.get("coverNote") ?? undefined,
    consent: form.get("consent") === "true",
    website: form.get("website") ?? undefined,
    careerSlug: form.get("careerSlug"),
    turnstileToken: form.get("turnstileToken") ?? undefined,
  });
  if (!parsed.success) {
    await record("ditolak_validasi");
    return fail("Periksa lagi isian form.", 400, z.flattenError(parsed.error).fieldErrors);
  }
  const input = parsed.data;

  if (input.website) {
    await record("ditolak_honeypot");
    return NextResponse.json({ ok: true });
  }

  if (!(await hitRateLimit("lamaran-ip", ip, 60 * 60, 5))) {
    await record("ditolak_rate_limit");
    return fail("Terlalu banyak kiriman. Coba lagi dalam 1 jam.", 429);
  }

  if (!(await verifyTurnstile(input.turnstileToken, ip))) {
    await record("ditolak_turnstile");
    return fail("Verifikasi keamanan gagal. Muat ulang halaman, lalu kirim lagi.", 403);
  }

  const file = form.get("cv");
  const cv = file instanceof File ? file : null;
  const problem = cvProblem(cv);
  if (problem || !cv) {
    await record("ditolak_validasi");
    return fail(problem ?? "Lampirkan CV dalam format PDF.", 400, { cv: [problem ?? ""] });
  }
  const bytes = new Uint8Array(await cv.arrayBuffer());
  if (!looksLikePdf(bytes)) {
    await record("ditolak_validasi");
    return fail("CV harus berformat PDF.", 400, { cv: ["CV harus berformat PDF."] });
  }

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const { data: career } = await admin
    .from("careers")
    .select("id")
    .eq("slug", input.careerSlug)
    .eq("content_status", "terbit")
    .is("deleted_at", null)
    .or(`closes_on.is.null,closes_on.gte.${today}`)
    .maybeSingle();
  if (!career) return fail("Lowongan ini sudah ditutup.", 404);

  const phone = normalizePhoneID(input.phone);
  if (!phone) return fail("Nomor HP tidak valid. Contoh: 0812 3456 7890.");

  const path = `${career.id}/${randomUUID()}.pdf`;
  const upload = await admin.storage
    .from("job-applications")
    .upload(path, bytes, { contentType: "application/pdf", upsert: false });
  if (upload.error) throw new Error(`CV gagal disimpan: ${upload.error.message}`);

  const { data: application, error } = await admin
    .from("job_applications")
    .insert({
      career_id: career.id,
      full_name: input.fullName,
      phone,
      email: input.email,
      cv_path: path,
      cover_note: input.coverNote || null,
      consent_pdp_at: new Date().toISOString(),
      consent_text_version: PRIVACY_POLICY_VERSION,
    })
    .select("id")
    .single();
  if (error) {
    await admin.storage.from("job-applications").remove([path]);
    throw new Error(`Lamaran gagal disimpan: ${error.message}`);
  }

  await record("diterima", application.id);
  return NextResponse.json({ ok: true });
}
