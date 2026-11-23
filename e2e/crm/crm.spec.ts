import { randomInt, randomUUID } from "node:crypto";
import type { Page } from "@playwright/test";
import { createPortalUser, type TestUser } from "../factories/users";
import { waitForEmail } from "../fixtures/mailpit";
import { adminClient } from "../fixtures/supabase";
import { expectNoA11yViolations, expectResponsive } from "../fixtures/test";
import { expect, loginViaForm, storageStateFor, test } from "../fixtures/portal";

function todayWib(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
}

function localPhone(): string {
  return `0812${String(randomInt(10_000_000, 99_999_999))}`;
}

function e164(local: string): string {
  return `+62${local.slice(1)}`;
}

async function marketingOnDuty(prefix: string): Promise<TestUser> {
  const user = await createPortalUser({ role: "marketing", prefix });
  const admin = adminClient();
  await admin.from("work_schedules").insert({
    scope: "karyawan",
    user_id: user.id,
    start_time: "00:00",
    end_time: "23:59:59",
    workdays: [1, 2, 3, 4, 5, 6, 7],
    late_tolerance_min: 0,
  });
  await admin.from("attendance_records").insert({
    user_id: user.id,
    work_date: todayWib(),
    clock_in_at: new Date().toISOString(),
    clock_in_lat: -6.25,
    clock_in_lng: 107.05,
    clock_in_photo_path: `${user.id}/${todayWib()}/masuk-crm.webp`,
  });
  await admin.from("work_reports").insert({
    user_id: user.id,
    work_date: todayWib(),
    kind: "rencana",
    content: "Follow up lead baru dan survei lokasi.",
  });
  return user;
}

async function projectFor(marketing: readonly TestUser[]): Promise<{ id: string; name: string }> {
  const suffix = randomUUID().slice(0, 8);
  const name = `Proyek uji CRM ${suffix}`;
  const admin = adminClient();
  const { data, error } = await admin
    .from("projects")
    .insert({ slug: `uji-crm-${suffix}`, name })
    .select("id")
    .single();
  if (error) throw new Error(`Gagal membuat proyek test: ${error.message}`);
  if (marketing.length > 0) {
    await admin.from("project_assignments").insert(
      marketing.map((user) => ({
        project_id: data.id,
        user_id: user.id,
        role_on_project: "marketing" as const,
      })),
    );
  }
  return { id: data.id, name };
}

async function insertLead(values: {
  projectId: string;
  ownerId?: string;
}): Promise<{ id: string; name: string }> {
  const name = `Konsumen ${randomUUID().slice(0, 6)}`;
  const { data, error } = await adminClient()
    .from("leads")
    .insert({
      full_name: name,
      phone: e164(localPhone()),
      source_kind: "website",
      project_id: values.projectId,
      owner_id: values.ownerId ?? null,
      consent_pdp_at: new Date().toISOString(),
      consent_text_version: "uji",
    })
    .select("id")
    .single();
  if (error) throw new Error(`Gagal membuat lead test: ${error.message}`);
  return { id: data.id, name };
}

async function leadRow(id: string) {
  const { data } = await adminClient()
    .from("leads")
    .select("owner_id, stage, first_response_at, sla_due_at")
    .eq("id", id)
    .single();
  return data;
}

async function addLeadThroughDialog(page: Page, projectName: string): Promise<string> {
  const name = `Konsumen ${randomUUID().slice(0, 6)}`;
  await page.getByRole("button", { name: "Tambah lead" }).click();
  const dialog = page.getByRole("dialog", { name: "Tambah lead" });
  const form = dialog.getByRole("form", { name: "Lead baru" });
  await form.getByRole("button", { name: "Simpan lead" }).click();
  await expect(form.getByText("Isi nama konsumen.")).toBeVisible();
  await expect(form.getByText("Konsumen harus setuju datanya disimpan.")).toBeVisible();
  await form.getByLabel("Nama konsumen").fill(name);
  await form.getByLabel("Nomor HP").fill(localPhone());
  await form.getByRole("combobox", { name: "Sumber" }).click();
  await page.getByRole("option", { name: "Datang ke kantor" }).click();
  await form.getByRole("combobox", { name: "Proyek (opsional)" }).click();
  await page.getByRole("option", { name: projectName }).click();
  await form.getByLabel("Konsumen setuju datanya disimpan untuk dihubungi marketing KIS.").check();
  await expectNoA11yViolations(page);
  await form.getByRole("button", { name: "Simpan lead" }).click();
  await expect(page.getByText("Lead tersimpan.")).toBeVisible();
  await expect(page).toHaveURL(/\/portal\/crm\/[0-9a-f-]{36}$/);
  return name;
}

function leadIdFrom(page: Page): string {
  return page.url().split("/").at(-1) ?? "";
}

test.describe("CRM oleh Direktur Utama", () => {
  test.use({ storageState: storageStateFor("owner") });

  test("lead baru dibagi ke marketing proyek yang bertugas, marketing diberi tahu", async ({
    page,
  }) => {
    const marketing = await marketingOnDuty("crm-giliran");
    const project = await projectFor([marketing]);
    await page.goto("/portal/crm");
    await expect(page.getByRole("heading", { name: "CRM", level: 1 })).toBeVisible();
    const name = await addLeadThroughDialog(page, project.name);

    const data = page.getByRole("region", { name: "Data lead" });
    await expect(data.getByText(marketing.fullName)).toBeVisible();
    await expect(data.getByText(/Respons sebelum/)).toBeVisible();
    const id = leadIdFrom(page);
    expect(await leadRow(id)).toMatchObject({ owner_id: marketing.id, stage: "baru" });
    const { data: assignment } = await adminClient()
      .from("lead_assignments")
      .select("reason, to_user_id")
      .eq("lead_id", id)
      .single();
    expect(assignment).toEqual({ reason: "giliran", to_user_id: marketing.id });
    await expect
      .poll(async () => {
        const { data: rows } = await adminClient()
          .from("notifications")
          .select("kind, href")
          .eq("user_id", marketing.id);
        return rows ?? [];
      })
      .toContainEqual({ kind: "lead_baru", href: `/portal/crm/${id}` });
    await waitForEmail(marketing.email, `Lead baru: ${name}`);
    await expectNoA11yViolations(page);
    await expectResponsive(page, page.getByRole("main"));
  });

  test("tanpa marketing bertugas, lead masuk antrean lalu dibagikan", async ({ page }) => {
    const offDuty = await createPortalUser({ role: "marketing", prefix: "crm-libur" });
    const project = await projectFor([offDuty]);
    await page.goto("/portal/crm");
    const name = await addLeadThroughDialog(page, project.name);
    const id = leadIdFrom(page);
    const data = page.getByRole("region", { name: "Data lead" });
    await expect(data.getByText("Antrean manajer")).toBeVisible();
    expect((await leadRow(id))?.owner_id).toBeNull();

    await page.goto("/portal/crm");
    await expect(page.getByRole("button", { name: /Antrean/, pressed: true })).toBeVisible();
    await page.getByRole("searchbox", { name: "Cari lead" }).fill(name);
    const list = page.getByRole("list", { name: "Daftar lead" });
    await expect(list.getByRole("listitem", { name })).toBeVisible();
    await expectNoA11yViolations(page);
    await expectResponsive(page, page.getByRole("main"));
    await list.getByRole("link", { name: new RegExp(name) }).click();
    await expect(page).toHaveURL(`/portal/crm/${id}`);

    await page.getByRole("button", { name: "Bagikan" }).click();
    const dialog = page.getByRole("dialog", { name: "Pindahkan lead" });
    await dialog.getByRole("combobox", { name: "Marketing" }).click();
    await page.getByRole("option", { name: offDuty.fullName }).click();
    await dialog.getByRole("button", { name: "Pindahkan" }).click();
    await expect(page.getByText("Lead dipindahkan.")).toBeVisible();
    await expect(data.getByText(offDuty.fullName)).toBeVisible();
    expect((await leadRow(id))?.owner_id).toBe(offDuty.id);
    await expect(page.getByRole("list", { name: "Riwayat lead" })).toContainText(
      `Dipindah manajer: ${offDuty.fullName}`,
    );
    await expect
      .poll(async () => {
        const { data: rows } = await adminClient()
          .from("notifications")
          .select("kind")
          .eq("user_id", offDuty.id);
        return rows?.map((row) => row.kind) ?? [];
      })
      .toContain("lead_baru");
  });

  test("lewat batas respons, lead kembali ke antrean", async ({ page }) => {
    const marketing = await marketingOnDuty("crm-sla");
    const project = await projectFor([marketing]);
    const lead = await insertLead({ projectId: project.id });
    expect((await leadRow(lead.id))?.owner_id).toBe(marketing.id);
    await adminClient()
      .from("leads")
      .update({ sla_due_at: new Date(Date.now() - 60_000).toISOString() })
      .eq("id", lead.id);
    const { error } = await adminClient().rpc("crm_sla_sweep");
    expect(error).toBeNull();
    expect((await leadRow(lead.id))?.owner_id).toBeNull();

    await page.goto("/portal/crm");
    await page.getByRole("searchbox", { name: "Cari lead" }).fill(lead.name);
    await expect(
      page.getByRole("list", { name: "Daftar lead" }).getByRole("listitem", { name: lead.name }),
    ).toBeVisible();
    const { data: notified } = await adminClient()
      .from("notifications")
      .select("kind")
      .eq("user_id", marketing.id);
    expect(notified?.map((row) => row.kind)).toContain("lead_sla_lewat");
  });

  test("atur batas respons", async ({ page }) => {
    await page.goto("/portal/crm");
    try {
      await page.getByRole("button", { name: /^Batas respons \d+ menit$/ }).click();
      const dialog = page.getByRole("dialog", { name: "Batas respons" });
      const field = dialog.getByLabel("Batas respons (menit)");
      await field.fill("4");
      await dialog.getByRole("button", { name: "Simpan" }).click();
      await expect(dialog.getByText("Minimal 5 menit.")).toBeVisible();
      await field.fill("45");
      await dialog.getByRole("button", { name: "Simpan" }).click();
      await expect(page.getByText("Batas respons tersimpan.")).toBeVisible();
      await expect(page.getByRole("button", { name: "Batas respons 45 menit" })).toBeVisible();
      const { data } = await adminClient().from("crm_settings").select("sla_minutes").single();
      expect(data?.sla_minutes).toBe(45);
    } finally {
      await adminClient().from("crm_settings").update({ sla_minutes: 30 }).eq("id", true);
    }
  });
});

test.describe("CRM oleh marketing", () => {
  test("catat aktivitas dan ubah tahap, respons pertama tercatat", async ({ page }) => {
    const marketing = await marketingOnDuty("crm-kerja");
    const project = await projectFor([marketing]);
    const lead = await insertLead({ projectId: project.id });
    await page.goto("/portal/login");
    await loginViaForm(page, marketing);
    await expect(page).toHaveURL("/portal/crm");

    const list = page.getByRole("list", { name: "Daftar lead" });
    const row = list.getByRole("listitem", { name: lead.name });
    await expect(row).toContainText("Respons sebelum");
    await expectNoA11yViolations(page);
    await row.getByRole("link").click();
    await expect(page).toHaveURL(`/portal/crm/${lead.id}`);

    await page.getByRole("button", { name: "Catat aktivitas" }).click();
    const activity = page.getByRole("dialog", { name: "Catat aktivitas" });
    await activity.getByLabel("Hasil").fill("ok");
    await activity.getByRole("button", { name: "Simpan aktivitas" }).click();
    await expect(activity.getByText("Tulis hasilnya minimal 3 karakter.")).toBeVisible();
    await activity.getByLabel("Hasil").fill("Konsumen minta jadwal survei hari Sabtu.");
    await activity.getByRole("button", { name: "Simpan aktivitas" }).click();
    await expect(page.getByText("Aktivitas tercatat.")).toBeVisible();
    await expect(page.getByRole("list", { name: "Riwayat lead" })).toContainText(
      "Konsumen minta jadwal survei hari Sabtu.",
    );
    await expect.poll(async () => (await leadRow(lead.id))?.first_response_at).not.toBeNull();
    expect((await leadRow(lead.id))?.sla_due_at).toBeNull();

    await page.getByRole("button", { name: "Ubah tahap" }).click();
    const stage = page.getByRole("dialog", { name: "Ubah tahap" });
    await stage.getByRole("combobox", { name: "Tahap" }).click();
    await page.getByRole("option", { name: "Batal" }).click();
    await stage.getByRole("button", { name: "Simpan tahap" }).click();
    await expect(stage.getByText("Tulis alasan batal minimal 5 karakter.")).toBeVisible();
    await stage.getByRole("combobox", { name: "Tahap" }).click();
    await page.getByRole("option", { name: "Prospek" }).click();
    await stage.getByRole("button", { name: "Simpan tahap" }).click();
    await expect(page.getByText("Tahap tersimpan.")).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Data lead" }).getByText("Prospek"),
    ).toBeVisible();
    expect((await leadRow(lead.id))?.stage).toBe("prospek");
    await expect(page.getByText("Aktivitas tercatat.")).toBeHidden({ timeout: 15_000 });
    await expect(page.getByText("Tahap tersimpan.")).toBeHidden({ timeout: 15_000 });
    await expectNoA11yViolations(page);
    await expectResponsive(page, page.getByRole("main"));
  });

  test("lead marketing lain tidak bisa dibuka", async ({ page }) => {
    const marketing = await marketingOnDuty("crm-batas");
    const other = await createPortalUser({ role: "marketing", prefix: "crm-lain" });
    const project = await projectFor([]);
    const lead = await insertLead({ projectId: project.id, ownerId: other.id });
    await page.goto("/portal/login");
    await loginViaForm(page, marketing);
    await expect(page).toHaveURL("/portal/crm");
    await expect(page.getByText(lead.name)).toHaveCount(0);
    await page.goto(`/portal/crm/${lead.id}`);
    await expect(page.getByText("Lead tidak ditemukan")).toBeVisible();
    await expect(page.getByText(lead.name)).toHaveCount(0);
  });
});
