import { describe, expect, it } from "vitest";
import { resolvePortalRoute, toPublicPath } from "./portal-host";

const PORTAL = "company.kisgroup.co.id";

describe("resolvePortalRoute", () => {
  it("tanpa PORTAL_HOST, portal tetap di /portal pada host mana pun", () => {
    expect(
      resolvePortalRoute({
        host: "kisg-web.vercel.app",
        pathname: "/portal/crm",
        portalHost: undefined,
      }),
    ).toEqual({
      kind: "portal",
      internalPath: "/portal/crm",
      onPortalHost: false,
    });
    expect(
      resolvePortalRoute({ host: "kisgroup.co.id", pathname: "/proyek", portalHost: "" }),
    ).toEqual({
      kind: "passthrough",
    });
  });

  it("dengan PORTAL_HOST, /portal di website menjadi 404 dan halaman website tetap jalan", () => {
    expect(
      resolvePortalRoute({ host: "kisgroup.co.id", pathname: "/portal", portalHost: PORTAL }),
    ).toEqual({
      kind: "not-found",
    });
    expect(
      resolvePortalRoute({ host: "kisgroup.co.id", pathname: "/portal/login", portalHost: PORTAL }),
    ).toEqual({
      kind: "not-found",
    });
    expect(
      resolvePortalRoute({ host: "kisgroup.co.id", pathname: "/proyek", portalHost: PORTAL }),
    ).toEqual({
      kind: "passthrough",
    });
  });

  it("di host portal, path bersih di-rewrite ke route /portal", () => {
    expect(resolvePortalRoute({ host: PORTAL, pathname: "/", portalHost: PORTAL })).toEqual({
      kind: "portal",
      internalPath: "/portal",
      onPortalHost: true,
    });
    expect(
      resolvePortalRoute({ host: `${PORTAL}:443`, pathname: "/login", portalHost: PORTAL }),
    ).toEqual({
      kind: "portal",
      internalPath: "/portal/login",
      onPortalHost: true,
    });
  });

  it("di host portal, alamat lama /portal/... dialihkan ke alamat bersih", () => {
    expect(
      resolvePortalRoute({ host: PORTAL, pathname: "/portal/crm", portalHost: PORTAL }),
    ).toEqual({
      kind: "redirect",
      location: "/crm",
    });
    expect(resolvePortalRoute({ host: PORTAL, pathname: "/portal", portalHost: PORTAL })).toEqual({
      kind: "redirect",
      location: "/",
    });
  });

  it("huruf besar dan port pada host tidak memengaruhi hasil", () => {
    expect(
      resolvePortalRoute({ host: "Company.KISGroup.co.id:3000", pathname: "/", portalHost: PORTAL })
        .kind,
    ).toBe("portal");
  });
});

describe("toPublicPath", () => {
  it("hanya memotong awalan /portal di host portal", () => {
    expect(toPublicPath("/portal/akses-ditolak", true)).toBe("/akses-ditolak");
    expect(toPublicPath("/portal", true)).toBe("/");
    expect(toPublicPath("/portal/crm", false)).toBe("/portal/crm");
    expect(toPublicPath("/api/lamaran", true)).toBe("/api/lamaran");
  });
});
