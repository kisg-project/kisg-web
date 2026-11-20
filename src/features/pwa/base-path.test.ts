import { describe, expect, it } from "vitest";
import { portalBase, portalManifest } from "./base-path";
import { serviceWorkerSource } from "./service-worker";

describe("portalBase", () => {
  it("kosong di host portal, /portal di host lain atau tanpa PORTAL_HOST", () => {
    expect(portalBase("company.kisgroup.co.id", "company.kisgroup.co.id")).toBe("");
    expect(portalBase("COMPANY.kisgroup.co.id:443", "company.kisgroup.co.id")).toBe("");
    expect(portalBase("kisgroup.co.id", "company.kisgroup.co.id")).toBe("/portal");
    expect(portalBase("kisg-web.vercel.app", undefined)).toBe("/portal");
    expect(portalBase(null, undefined)).toBe("/portal");
  });
});

describe("portalManifest", () => {
  it("start_url dan scope mengikuti base, dengan ikon maskable", () => {
    const manifest = portalManifest("/portal");
    expect(manifest).toMatchObject({
      start_url: "/portal/",
      scope: "/portal/",
      display: "standalone",
    });
    expect(manifest.icons.some((icon) => icon.purpose === "maskable")).toBe(true);
    expect(portalManifest("").scope).toBe("/");
  });
});

describe("serviceWorkerSource", () => {
  it("menyimpan halaman offline sesuai base dan tidak meng-cache request selain GET", () => {
    const source = serviceWorkerSource("/portal");
    expect(source).toContain('"/portal/offline"');
    expect(source).toContain('if (request.method !== "GET") return;');
    expect(serviceWorkerSource("")).toContain('"/offline"');
  });
});
