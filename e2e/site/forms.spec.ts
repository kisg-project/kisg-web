import { randomInt, randomUUID } from "node:crypto";
import type { Page } from "@playwright/test";
import { adminClient } from "../fixtures/supabase";
import { expect, test } from "../fixtures/portal";

// Form publik diuji sampai database Supabase lokal (CLAUDE.md bagian 5). Setiap test memakai nomor
// HP dan IP tiruan sendiri, jadi rate limit dan penggabungan lead tidak saling mengganggu.

const PROJECT_PATH = "/proyek/sejahtera-green-village";
const SGV_ID = "5a7e0000-0000-4000-8000-000000000001";

function uniquePhone(): { local: string; e164: string } {
  const digits = String(randomInt(10_000_000, 99_999_999));
  return { local: `0812${digits}`, e164: `+62812${digits}` };
}

async function fillLead(
  page: Page,
  form: string,
  data: { name: string; phone: string; consent?: boolean },
) {
  const scope = page.getByRole("form", { name: form });
  await scope.getByLabel("Nama").fill(data.name);
  await scope.getByLabel("Nomor WhatsApp").fill(data.phone);
  if (data.consent !== false) await scope.getByRole("checkbox").check();
  return scope;
}

async function leadByPhone(e164: string) {
  const { data } = await adminClient().from("leads").select("*").eq("phone", e164).maybeSingle();
  return data;
}

test.describe("Form lead", () => {
  test("form minat di detail proyek tersimpan lengkap dengan UTM dan sumber", async ({ page }) => {
    const phone = uniquePhone();
    await page.goto(
      `${PROJECT_PATH}?utm_source=facebook&utm_medium=cpc&utm_campaign=uji-e2e&fbclid=fb-${randomUUID()}`,
    );
    const form = await fillLead(page, "Form minat", { name: "Uji Minat", phone: phone.local });
    await form.getByLabel("Pesan (opsional)").fill("Minta info unit tersedia.");
    await form.getByRole("button", { name: "Kirim" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Terima kasih" })).toBeVisible();

    await expect.poll(() => leadByPhone(phone.e164)).not.toBeNull();
    const lead = await leadByPhone(phone.e164);
    expect(lead).toMatchObject({
      full_name: "Uji Minat",
      source_kind: "website",
      source_detail: "Form minat website",
      project_id: SGV_ID,
      stage: "baru",
      note: "Minta info unit tersedia.",
    });
    expect(lead?.consent_pdp_at).not.toBeNull();
    expect(lead?.consent_text_version).toBeTruthy();

    const admin = adminClient();
    const { data: touch } = await admin
      .from("utm_touchpoints")
      .select("*")
      .eq("lead_id", lead?.id ?? "")
      .single();
    expect(touch).toMatchObject({
      utm_source: "facebook",
      utm_medium: "cpc",
      utm_campaign: "uji-e2e",
      landing_path: PROJECT_PATH,
    });
    expect(touch?.fbclid).toMatch(/^fb-/);
    const { data: submission } = await admin
      .from("form_submissions")
      .select("status, form_kind, page_path")
      .eq("lead_id", lead?.id ?? "")
      .single();
    expect(submission).toEqual({ status: "diterima", form_kind: "minat", page_path: PROJECT_PATH });
  });

  test("minta brosur dan nomor yang sama digabung ke lead lama", async ({ page }) => {
    const phone = uniquePhone();
    await page.goto(PROJECT_PATH);
    let form = await fillLead(page, "Form brosur", { name: "Uji Brosur", phone: phone.local });
    await form.getByRole("button", { name: "Minta brosur" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Permintaan diterima" })).toBeVisible();
    await expect.poll(async () => (await leadByPhone(phone.e164))?.note).toBe("Minta brosur.");

    await page.goto("/kontak");
    form = await fillLead(page, "Form kontak", { name: "Uji Brosur Lagi", phone: phone.local });
    await form.getByRole("button", { name: "Kirim pesan" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Pesan terkirim" })).toBeVisible();

    const { data: leads } = await adminClient().from("leads").select("id").eq("phone", phone.e164);
    expect(leads).toHaveLength(1);
    const { data: activities } = await adminClient()
      .from("lead_activities")
      .select("body")
      .eq("lead_id", leads?.[0]?.id ?? "");
    expect(activities).toEqual([{ body: "Lead masuk lagi." }]);
  });

  test("validasi di browser: isian kosong, nomor salah, tanpa persetujuan", async ({ page }) => {
    await page.goto("/kontak");
    const form = page.getByRole("form", { name: "Form kontak" });
    await form.getByRole("button", { name: "Kirim pesan" }).click();
    await expect(form.getByText("Isi nama Anda, minimal 2 huruf.")).toBeVisible();
    await expect(form.getByText("Isi nomor WhatsApp Anda.")).toBeVisible();
    await expect(form.getByText(/Centang persetujuan/)).toBeVisible();

    const phone = uniquePhone();
    await fillLead(page, "Form kontak", { name: "Uji", phone: "12345", consent: false });
    await form.getByRole("button", { name: "Kirim pesan" }).click();
    await expect(form.getByText(/Nomor HP tidak valid/)).toBeVisible();
    await form.getByLabel("Nomor WhatsApp").fill(phone.local);
    await form.getByRole("button", { name: "Kirim pesan" }).click();
    await expect(form.getByText(/Centang persetujuan/)).toBeVisible();
    expect(await leadByPhone(phone.e164)).toBeNull();
  });

  test("tautan kebijakan privasi menyatu di kalimat persetujuan dan dibuka di tab baru", async ({
    page,
  }) => {
    await page.goto("/kontak");
    const form = page.getByRole("form", { name: "Form kontak" });
    const link = form.getByRole("link", { name: "kebijakan privasi" });
    await expect(link).toHaveAttribute("href", "/kebijakan-privasi");
    await expect(link).toHaveAttribute("target", "_blank");
    // Tautan berada di baris teks yang sama dengan kalimat persetujuan, bukan kolom terpisah.
    const label = form.locator("label", { has: link });
    await expect(label).toContainText("Saya setuju data saya dipakai KIS Group");
    await expect(label).toHaveCSS("display", "block");
  });

  test("honeypot terisi: tampak berhasil tetapi lead tidak dibuat", async ({ page }) => {
    const phone = uniquePhone();
    await page.goto("/kontak");
    const form = await fillLead(page, "Form kontak", { name: "Bot", phone: phone.local });
    await page.locator("#kontak-website").fill("https://spam.example");
    await form.getByRole("button", { name: "Kirim pesan" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Pesan terkirim" })).toBeVisible();
    expect(await leadByPhone(phone.e164)).toBeNull();
  });

  test("rate limit nomor HP: kiriman keempat dalam satu jam ditolak", async ({ page }) => {
    const phone = uniquePhone();
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      await page.goto("/kontak");
      const form = await fillLead(page, "Form kontak", {
        name: `Uji ${String(attempt)}`,
        phone: phone.local,
      });
      await form.getByRole("button", { name: "Kirim pesan" }).click();
      await expect(page.getByRole("status").filter({ hasText: "Pesan terkirim" })).toBeVisible();
    }
    await page.goto("/kontak");
    const form = await fillLead(page, "Form kontak", { name: "Uji 4", phone: phone.local });
    await form.getByRole("button", { name: "Kirim pesan" }).click();
    await expect(form.getByRole("alert")).toHaveText(/Terlalu banyak kiriman/);
  });
});

test.describe("Lamaran kerja", () => {
  const PDF = Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n");

  async function createCareer() {
    const slug = `uji-lowongan-${randomUUID().slice(0, 8)}`;
    const { data, error } = await adminClient()
      .from("careers")
      .insert({
        slug,
        title: "Marketing Properti (uji)",
        department: "Pemasaran",
        location: "Bekasi",
        content_status: "terbit",
        description: [{ type: "paragraph", text: "Menangani calon pembeli." }],
        requirements: ["Domisili Bekasi"],
      })
      .select("id, slug")
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  test("lamaran dengan CV PDF tersimpan di database dan storage privat", async ({ page }) => {
    const career = await createCareer();
    const phone = uniquePhone();
    await page.goto(`/karir/${career.slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Marketing Properti (uji)");
    const form = page.getByRole("form", { name: "Form lamaran" });
    await form.getByLabel("Nama lengkap").fill("Uji Pelamar");
    await form.getByLabel("Nomor WhatsApp").fill(phone.local);
    await form.getByLabel("Email").fill("pelamar@e2e.kisgroup.co.id");
    await form.getByLabel("CV (PDF, maksimal 2 MB)").setInputFiles({
      name: "cv.pdf",
      mimeType: "application/pdf",
      buffer: PDF,
    });
    await form.getByRole("checkbox").check();
    await form.getByRole("button", { name: "Kirim lamaran" }).click();
    await expect(page.getByRole("status")).toContainText(
      "Lamaran untuk Marketing Properti (uji) terkirim",
    );

    const { data: application } = await adminClient()
      .from("job_applications")
      .select("*")
      .eq("career_id", career.id)
      .single();
    expect(application).toMatchObject({
      full_name: "Uji Pelamar",
      phone: phone.e164,
      status: "baru",
    });
    const download = await adminClient()
      .storage.from("job-applications")
      .download(application?.cv_path ?? "");
    expect(download.error).toBeNull();
  });

  test.describe("file ditolak", () => {
    // Server menjawab 400 untuk file yang bukan PDF, dan browser selalu mencatatnya di console.
    test.use({ allowedConsoleErrors: [/status of 400/] });

    test("CV bukan PDF ditolak, termasuk file lain yang diganti namanya", async ({ page }) => {
      const career = await createCareer();
      await page.goto(`/karir/${career.slug}`);
      const form = page.getByRole("form", { name: "Form lamaran" });
      const cv = form.getByLabel("CV (PDF, maksimal 2 MB)");
      await cv.setInputFiles({
        name: "cv.docx",
        mimeType: "application/msword",
        buffer: Buffer.from("x"),
      });
      await expect(form.getByText("CV harus berformat PDF.")).toBeVisible();

      await form.getByLabel("Nama lengkap").fill("Uji Palsu");
      await form.getByLabel("Nomor WhatsApp").fill(uniquePhone().local);
      await form.getByLabel("Email").fill("palsu@e2e.kisgroup.co.id");
      await cv.setInputFiles({
        name: "cv.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("bukan pdf"),
      });
      await form.getByRole("checkbox").check();
      await form.getByRole("button", { name: "Kirim lamaran" }).click();
      await expect(form.getByRole("alert")).toHaveText("CV harus berformat PDF.");
      const { data } = await adminClient()
        .from("job_applications")
        .select("id")
        .eq("career_id", career.id);
      expect(data).toEqual([]);
    });
  });
});
