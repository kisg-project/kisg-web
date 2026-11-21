import type { Page } from "@playwright/test";
import { adminClient } from "../fixtures/supabase";
import { expect, expectNoA11yViolations, test } from "../fixtures/test";

// Build CI memakai CHAT_MOCK=1: jawaban tiruan yang tetap, tanpa memanggil Gemini (CLAUDE.md bagian 12).

async function openChat(page: Page) {
  await page.getByRole("button", { name: "Tanya Jaka" }).click();
  const dialog = page.getByRole("dialog", { name: "Chat dengan Jaka" });
  await expect(dialog).toBeVisible();
  return dialog;
}

async function messagesOf(content: string) {
  const { data: user } = await adminClient()
    .from("chat_messages")
    .select("session_id")
    .eq("role", "user")
    .eq("content", content)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!user) return [];
  const { data } = await adminClient()
    .from("chat_messages")
    .select("role, content")
    .eq("session_id", user.session_id)
    .order("created_at");
  return data ?? [];
}

test.describe("Chat Jaka", () => {
  test("membuka panel, saran pertanyaan, jawaban di-stream, dan percakapan tersimpan", async ({
    page,
  }) => {
    await page.goto("/");
    const dialog = await openChat(page);
    await expect(dialog.getByText(/Halo, saya Jaka, asisten virtual KIS Group/)).toBeVisible();
    await expect(dialog.getByText(/Jaka adalah asisten virtual/)).toBeVisible();
    await expectNoA11yViolations(page);

    const question = `Berapa harga rumahnya? ${String(Date.now())}`;
    await dialog.getByLabel("Tulis pesan untuk Jaka").fill(question);
    await dialog.getByRole("button", { name: "Kirim pesan" }).click();
    const log = dialog.getByRole("log", { name: "Percakapan" });
    await expect(log.getByText(`Pertanyaan Anda: ${question}.`, { exact: false })).toBeVisible();
    await expect(dialog.getByRole("list", { name: "Saran pertanyaan" })).toHaveCount(0);

    // Pesan pengunjung dan jawaban Jaka tersimpan di database (jawaban disimpan saat stream selesai).
    await expect
      .poll(async () => (await messagesOf(question)).map((row) => row.role))
      .toEqual(["user", "assistant"]);

    // Panel ditutup dan dibuka lagi: percakapan tetap ada.
    await dialog.getByRole("button", { name: "Tutup chat" }).click();
    await expect(dialog).toBeHidden();
    await openChat(page);
    await expect(log.getByText(question, { exact: false }).first()).toBeVisible();
  });

  test("saran pertanyaan langsung terkirim", async ({ page }) => {
    await page.goto("/kontak");
    const dialog = await openChat(page);
    await dialog.getByRole("button", { name: "Hitung cicilan KPR" }).click();
    await expect(
      dialog.getByRole("log").getByText(/Pertanyaan Anda: Hitung cicilan KPR/),
    ).toBeVisible();
  });

  test("gangguan model: pesan ramah dan tombol WhatsApp, tanpa pesan error teknis", async ({
    page,
  }) => {
    await page.goto("/");
    const dialog = await openChat(page);
    await dialog.getByLabel("Tulis pesan untuk Jaka").fill("Ini uji gangguan");
    await dialog.getByLabel("Tulis pesan untuk Jaka").press("Enter");
    await expect(dialog.getByText(/Jaka sedang tidak bisa membalas saat ini/)).toBeVisible();
    const whatsapp = dialog.getByRole("link", { name: "Lanjut lewat WhatsApp" });
    await expect(whatsapp).toHaveAttribute("href", /^https:\/\/wa\.me\/6288290957177/);
    await expect(dialog.getByText(/error|gagal|Error/)).toHaveCount(0);
  });

  test("pesan terlalu panjang dibatasi di kolom isian", async ({ page }) => {
    await page.goto("/");
    const dialog = await openChat(page);
    await expect(dialog.getByLabel("Tulis pesan untuk Jaka")).toHaveAttribute("maxlength", "500");
  });

  test("layar penuh di desktop dan penuh layar di HP", async ({ page, isMobile }) => {
    await page.goto("/");
    const dialog = await openChat(page);
    const viewport = page.viewportSize();
    if (!viewport) throw new Error("Viewport tidak diketahui.");
    if (isMobile) {
      const box = await dialog.boundingBox();
      expect(box?.width).toBeCloseTo(viewport.width, 0);
      return;
    }
    const before = await dialog.boundingBox();
    expect(before?.width).toBeLessThan(viewport.width / 2);
    await dialog.getByRole("button", { name: "Layar penuh" }).click();
    await expect(dialog.getByRole("button", { name: "Kecilkan chat" })).toBeVisible();
    const after = await dialog.boundingBox();
    expect(after?.width).toBeGreaterThan(viewport.width - 64);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("permintaan tanpa data yang benar tetap dijawab ramah, bukan error", async ({ request }) => {
    const response = await request.post("/api/chat", { data: { tidak: "valid" } });
    expect(response.status()).toBe(200);
    expect(await response.text()).toContain("Jaka sedang tidak bisa membalas saat ini");
  });
});
