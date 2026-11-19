import { expect, test } from "../fixtures/test";

test("security headers terpasang di setiap response", async ({ request }) => {
  const response = await request.get("/");
  const headers = response.headers();
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["content-security-policy"]).toContain("object-src 'none'");
  expect(headers["strict-transport-security"]).toContain("max-age=");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["permissions-policy"]).toContain("geolocation=(self)");
  expect(headers["x-powered-by"]).toBeUndefined();
});

test("halaman yang tidak ada menampilkan 404 dan arahan ke beranda", async ({
  page,
  consoleErrors,
}) => {
  const response = await page.goto("/halaman-yang-tidak-ada");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { level: 1, name: "Halaman tidak ditemukan" }),
  ).toBeAttached();
  await page.getByRole("link", { name: "Ke beranda" }).click();
  await expect(page).toHaveURL(/\/$/);

  // Browser mencatat status 404 dokumen sebagai error console. Itu memang yang diuji di sini.
  expect(consoleErrors.every((message) => message.includes("404"))).toBe(true);
  consoleErrors.length = 0;
});
