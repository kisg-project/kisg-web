import path from "node:path";
import { randomUUID } from "node:crypto";
import { createPortalUser } from "../factories/users";
import { adminClient } from "../fixtures/supabase";
import { expectNoA11yViolations, expectResponsive } from "../fixtures/test";
import { expect, loginViaForm, storageStateFor, test } from "../fixtures/portal";

const PHOTO = path.join(process.cwd(), "e2e", "fixtures", "files", "exif-gps-rotated.jpg");

test.describe("Panel CMS: akses", () => {
  test("halaman masuk CMS: noindex, axe, dan responsif", async ({ page }) => {
    await page.goto("/cms/login");
    await expect(page.getByRole("heading", { level: 1, name: "Masuk ke panel CMS" })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expectNoA11yViolations(page);
    await expectResponsive(page);
  });

  test("belum masuk: halaman CMS mengarah ke halaman masuk CMS", async ({ page }) => {
    await page.goto("/cms/berita");
    await expect(page).toHaveURL(/\/cms\/login\?next=%2Fcms%2Fberita$/);
  });

  test("akun CMS tidak bisa masuk portal karyawan", async ({ page }) => {
    const cms = await createPortalUser({ role: "cms" });
    await page.goto("/portal/login");
    await loginViaForm(page, cms);
    await expect(page.getByRole("main").getByRole("alert")).toHaveText(
      "Akun ini khusus panel CMS. Masuk lewat halaman CMS.",
    );
  });

  test("akun owner tidak bisa masuk panel CMS", async ({ page }) => {
    const owner = await createPortalUser({ role: "owner" });
    await page.goto("/cms/login");
    await loginViaForm(page, owner);
    await expect(page.getByRole("main").getByRole("alert")).toHaveText(
      "Akun ini tidak punya akses ke panel CMS. Masuk lewat portal karyawan.",
    );
  });

  test("akun CMS masuk ke ringkasan CMS", async ({ page }) => {
    const cms = await createPortalUser({ role: "cms" });
    await page.goto("/cms/login");
    await loginViaForm(page, cms);
    await expect(page).toHaveURL("/cms");
    await expect(page.getByRole("heading", { level: 1, name: "Panel CMS" })).toBeVisible();
  });

  test.describe("sesi owner", () => {
    test.use({ storageState: storageStateFor("owner") });

    test("owner yang sedang masuk portal ditolak di CMS", async ({ page }) => {
      await page.goto("/cms");
      await expect(page).toHaveURL("/cms/ditolak");
      await expect(
        page.getByRole("heading", { level: 1, name: "Akun ini tidak bisa membuka panel CMS" }),
      ).toBeVisible();
      await expectNoA11yViolations(page);
    });
  });
});

test.describe("Panel CMS: konten", () => {
  test.use({ storageState: storageStateFor("cms") });

  test("ringkasan dan daftar berita: axe dan responsif", async ({ page }) => {
    await page.goto("/cms");
    await expectNoA11yViolations(page);
    await page
      .getByRole("navigation", { name: "Menu CMS" })
      .getByRole("link", { name: "Berita" })
      .click();
    await expect(page).toHaveURL("/cms/berita");
    await expect(page.getByRole("list", { name: "Daftar berita CMS" })).toContainText(
      "BI-Rate naik ke 6 persen",
    );
    await expectNoA11yViolations(page);
    await expectResponsive(page);
  });

  test("validasi form berita", async ({ page }) => {
    await page.goto("/cms/berita/baru");
    const form = page.getByRole("form", { name: "Form berita" });
    await form.getByRole("button", { name: "Simpan berita" }).click();
    await expect(form.getByText("Judul minimal 5 karakter.")).toBeVisible();
    await expect(form.getByText("Ringkasan minimal 20 karakter.")).toBeVisible();
    await expectNoA11yViolations(page);
  });

  test("tulis berita bersampul, terbitkan, ubah, lalu hapus: website ikut berubah", async ({
    page,
  }) => {
    const unique = randomUUID().slice(0, 8);
    const title = `Uji CMS berita ${unique}`;
    await page.goto("/cms/berita/baru");
    const form = page.getByRole("form", { name: "Form berita" });
    await form.getByLabel("Judul", { exact: true }).fill(title);
    await expect(form.getByLabel("Slug (alamat halaman)")).toHaveValue(`uji-cms-berita-${unique}`);
    await form.getByLabel("Ringkasan").fill("Ringkasan berita uji dari panel CMS untuk pengujian.");
    await form.getByLabel("Pilih gambar sampul").setInputFiles(PHOTO);
    await expect(form.getByRole("img", { name: "Pratinjau sampul" })).toBeVisible();
    await form.getByLabel("Teks alternatif sampul").fill("Foto uji sampul berita");
    await form.getByLabel("Teks Paragraf 1").fill("Paragraf pertama berita uji.");
    await form.getByRole("button", { name: "Tambah subjudul" }).click();
    await form.getByLabel("Teks Subjudul 2").fill("Subjudul uji");
    await form.getByRole("button", { name: "Tambah sumber" }).click();
    await form.getByLabel("Nama sumber 1").fill("Sumber uji");
    await form.getByLabel("Tautan sumber 1").fill("https://www.bi.go.id/");
    await form.getByRole("combobox", { name: "Status" }).click();
    await page.getByRole("option", { name: "Terbit" }).click();
    await form.getByRole("button", { name: "Simpan berita" }).click();
    await expect(page.getByText("Berita tersimpan.")).toBeVisible();
    await expect(page).toHaveURL(/\/cms\/berita\/[0-9a-f-]{36}$/);

    const { data: row } = await adminClient()
      .from("posts")
      .select("id, slug, content_status, published_at, cover_path, body")
      .eq("title", title)
      .single();
    expect(row?.content_status).toBe("terbit");
    expect(row?.published_at).not.toBeNull();
    expect(row?.cover_path).toContain("/storage/v1/object/public/public-assets/berita/");
    expect(row?.body).toEqual([
      { type: "paragraph", text: "Paragraf pertama berita uji." },
      { type: "heading", text: "Subjudul uji" },
      { type: "sources", items: [{ label: "Sumber uji", url: "https://www.bi.go.id/" }] },
    ]);

    // Website langsung berubah (cache diperbarui saat disimpan).
    const site = await page.context().newPage();
    await site.goto(`/berita/${row?.slug ?? ""}`);
    await expect(site.getByRole("heading", { level: 1 })).toHaveText(title);
    await expect(site.getByRole("region", { name: "Sumber" }).getByRole("link")).toHaveText(
      "Sumber uji",
    );

    // Ubah judul.
    await form.getByLabel("Judul", { exact: true }).fill(`${title} revisi`);
    await form.getByRole("button", { name: "Simpan berita" }).click();
    await expect(page.getByText("Perubahan berita tersimpan.")).toBeVisible();
    await site.reload();
    await expect(site.getByRole("heading", { level: 1 })).toHaveText(`${title} revisi`);

    // Hapus.
    await page.getByRole("button", { name: "Hapus berita" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Ya, hapus" }).click();
    await expect(page).toHaveURL("/cms/berita");
    await site.reload();
    await expect(site.getByRole("heading", { level: 1 })).toHaveText("Halaman tidak ditemukan");
    const { data: deleted } = await adminClient()
      .from("posts")
      .select("deleted_at")
      .eq("id", row?.id ?? "")
      .single();
    expect(deleted?.deleted_at).not.toBeNull();
  });

  test("slug yang sudah dipakai ditolak dengan pesan jelas", async ({ page }) => {
    await page.goto("/cms/berita/baru");
    const form = page.getByRole("form", { name: "Form berita" });
    await form.getByLabel("Judul", { exact: true }).fill("Judul berita dengan slug bentrok");
    await form.getByLabel("Slug (alamat halaman)").fill("daftar-cek-saat-survei-rumah");
    await form.getByLabel("Ringkasan").fill("Ringkasan berita uji untuk slug yang sudah dipakai.");
    await form.getByLabel("Teks Paragraf 1").fill("Isi.");
    await form.getByRole("button", { name: "Simpan berita" }).click();
    await expect(form.getByRole("alert")).toHaveText(/Slug sudah dipakai berita lain/);
  });

  test("lowongan berjenjang tampil di halaman jenjang karir", async ({ page }) => {
    const unique = randomUUID().slice(0, 8);
    const title = `Uji CMS lowongan ${unique}`;
    await page.goto("/cms/lowongan/baru");
    const form = page.getByRole("form", { name: "Form lowongan" });
    await form.getByLabel("Posisi").fill(title);
    await form.getByLabel("Divisi").fill("Teknik");
    await form.getByRole("combobox", { name: "Jenjang" }).click();
    await page.getByRole("option", { name: "Magang" }).click();
    await form.getByLabel("Teks Paragraf 1").fill("Membantu pengawas di lokasi proyek.");
    await form.getByLabel("Persyaratan").fill("Mahasiswa teknik sipil\nDomisili Bekasi");
    await form.getByRole("combobox", { name: "Status" }).click();
    await page.getByRole("option", { name: "Terbit" }).click();
    await form.getByRole("button", { name: "Simpan lowongan" }).click();
    await expect(page.getByText("Lowongan tersimpan.")).toBeVisible();

    const { data: row } = await adminClient()
      .from("careers")
      .select("slug, level, requirements, content_status")
      .eq("title", title)
      .single();
    expect(row).toMatchObject({
      level: "magang",
      content_status: "terbit",
      requirements: ["Mahasiswa teknik sipil", "Domisili Bekasi"],
    });

    const site = await page.context().newPage();
    await site.goto("/karir/jenjang/magang");
    await expect(site.getByRole("link", { name: new RegExp(title) })).toBeVisible();
    await site.goto(`/karir/${row?.slug ?? ""}`);
    await expect(site.getByRole("heading", { level: 1 })).toHaveText(title);
  });
});
