import { PORTAL_ROLES, ROLE_LABELS, type AppRole } from "../../src/config/roles";
import { PORTAL_AREAS, portalAreasFor, ROLE_HOME } from "../../src/config/portal";
import { expectNoA11yViolations, expectResponsive } from "../fixtures/test";
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

    test("menu hanya berisi area yang boleh dibuka", async ({ page }) => {
      await page.goto(ROLE_HOME[role]);
      const desktop = (page.viewportSize()?.width ?? 0) >= 1024;
      const nav = page.getByRole("navigation", {
        name: desktop ? "Menu portal" : "Menu portal bawah",
        exact: true,
      });
      await expect(nav.getByRole("link")).toHaveCount(allowed.length);
      for (const area of allowed) {
        await expect(
          nav.getByRole("link", { name: desktop ? area.label : area.shortLabel, exact: true }),
        ).toHaveAttribute("href", area.prefix);
      }
      if (!desktop) return;
      await expect(
        page.getByRole("banner").getByText(ROLE_LABELS[role], { exact: true }),
      ).toBeVisible();
    });

    for (const area of allowed) {
      test(`boleh membuka ${area.prefix}`, async ({ page }) => {
        await page.goto(area.prefix);
        await expect(page).toHaveURL(area.prefix);
        // Beranda role memakai sapaan sebagai h1 dan nama modul sebagai h2.
        const level = ROLE_HOME[role] === area.prefix ? 2 : 1;
        await expect(page.getByRole("heading", { level, name: area.label })).toBeVisible();
      });
    }

    for (const area of denied) {
      test(`ditolak membuka ${area.prefix}`, async ({ page }) => {
        await page.goto(area.prefix);
        await expect(page).toHaveURL("/portal/akses-ditolak");
        await expect(page.getByText("Anda tidak punya akses ke halaman ini.")).toBeVisible();
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
