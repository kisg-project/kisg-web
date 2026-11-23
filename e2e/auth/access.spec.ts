import { PORTAL_ROLES, ROLE_LABELS, type AppRole } from "../../src/config/roles";
import { PORTAL_AREAS, portalAreasFor, ROLE_HOME } from "../../src/config/portal";
import { bottomItems, railItems } from "../../src/config/portal-nav";
import { expectNoA11yViolations, expectNotFound, expectResponsive } from "../fixtures/test";
import { expect, storageStateFor, test } from "../fixtures/portal";

test.describe("Tanpa login", () => {
  for (const area of PORTAL_AREAS) {
    test(`${area.prefix} meminta login`, async ({ page }) => {
      await page.goto(area.prefix);
      await expect(page).toHaveURL(`/portal/login?next=${encodeURIComponent(area.prefix)}`);
    });
  }

  test("robots.txt memblokir portal", async ({ request }) => {
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /portal");
  });
});

// Satu describe per role, memakai sesi dari global-setup.ts.
for (const role of PORTAL_ROLES) {
  test.describe(`Role ${role}`, () => {
    test.use({ storageState: storageStateFor(role) });

    const allowed = portalAreasFor([role]);
    const denied = PORTAL_AREAS.filter((area) => !area.roles.includes(role));

    test("beranda portal mengarah ke beranda role", async ({ page }) => {
      await page.goto("/portal");
      await expect(page).toHaveURL(ROLE_HOME[role]);
    });

    test("halaman masuk mengarah ke beranda role", async ({ page }) => {
      await page.goto("/portal/login");
      await expect(page).toHaveURL(ROLE_HOME[role]);
    });

    test("menu hanya berisi fitur yang boleh dibuka", async ({ page }) => {
      await page.goto(ROLE_HOME[role]);
      const desktop = (page.viewportSize()?.width ?? 0) >= 1024;
      const nav = page.getByRole("navigation", {
        name: desktop ? "Menu portal" : "Menu portal bawah",
        exact: true,
      });
      const items = desktop ? railItems([role], role) : bottomItems([role], role);
      await expect(nav.getByRole("link")).toHaveCount(items.length + (desktop ? 0 : 1));
      for (const item of items) {
        await expect(nav.getByRole("link", { name: item.label, exact: true })).toHaveAttribute(
          "href",
          item.href,
        );
      }
      if (!desktop) {
        await expect(nav.getByRole("link", { name: "Akun", exact: true })).toHaveAttribute(
          "href",
          "/portal/akun",
        );
      }
      await expect(page.getByRole("button", { name: "Buka semua menu" })).toHaveCount(0);
      await expect(
        page.getByRole("list", { name: "Role" }).getByText(ROLE_LABELS[role], { exact: true }),
      ).toBeVisible();
    });

    for (const area of allowed) {
      test(`boleh membuka ${area.prefix}`, async ({ page }) => {
        await page.goto(area.prefix);
        await expect(page).toHaveURL(area.prefix);
        if (ROLE_HOME[role] === area.prefix) {
          await expect(page.getByRole("list", { name: "Role" })).toBeVisible();
        } else {
          await expect(page.getByRole("heading", { level: 1, name: area.label })).toBeVisible();
        }
      });
    }

    for (const area of denied) {
      test(`${area.prefix} tersembunyi: 404 di alamat yang sama, tanpa menu`, async ({
        page,
        consoleErrors,
      }) => {
        await page.goto(area.prefix);
        await expect(page).toHaveURL(area.prefix);
        await expectNotFound(page, consoleErrors);
        await expect(page.getByText("Kode 404")).toBeVisible();
        await expect(page.getByRole("link", { name: "Ke beranda" })).toBeVisible();
        await expect(
          page.getByRole("navigation").getByRole("link", { name: area.label, exact: true }),
        ).toHaveCount(0);
      });
    }
  });
}

test.describe("Tampilan portal", () => {
  const role: AppRole = "owner";
  test.use({ storageState: storageStateFor(role) });

  test("halaman modul aksesibel, responsif, dan tidak diindeks", async ({ page }) => {
    await page.goto(ROLE_HOME[role]);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expectNoA11yViolations(page);
    await expectResponsive(page);
  });

  test("halaman akses ditolak aksesibel", async ({ page }) => {
    await page.goto("/portal/akses-ditolak");
    await expect(page.getByRole("link", { name: "Ke beranda portal", exact: true })).toBeVisible();
    await expectNoA11yViolations(page);
  });
});
