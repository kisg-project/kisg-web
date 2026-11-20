import { describe, expect, it } from "vitest";
import { shouldReplace, trackingFromUrl } from "./tracking";

describe("trackingFromUrl", () => {
  it("mengambil UTM, fbclid, halaman, dan referrer luar", () => {
    const url = new URL(
      "https://kisgroup.co.id/proyek/sgv?utm_source=facebook&utm_medium=cpc&utm_campaign=des&fbclid=abc",
    );
    expect(trackingFromUrl(url, "https://www.facebook.com/")).toEqual({
      landingPath: "/proyek/sgv",
      utmSource: "facebook",
      utmMedium: "cpc",
      utmCampaign: "des",
      fbclid: "abc",
      referrer: "https://www.facebook.com/",
    });
  });

  it("referrer dari situs sendiri tidak dicatat", () => {
    const url = new URL("https://kisgroup.co.id/kontak");
    expect(trackingFromUrl(url, "https://kisgroup.co.id/")).toEqual({ landingPath: "/kontak" });
  });
});

describe("shouldReplace", () => {
  it("jejak pertama selalu disimpan", () => {
    expect(shouldReplace({ landingPath: "/" }, null)).toBe(true);
  });

  it("kunjungan internal tidak menimpa jejak iklan", () => {
    expect(shouldReplace({ landingPath: "/kontak" }, { utmSource: "facebook" })).toBe(false);
    expect(shouldReplace({ utmSource: "google" }, { utmSource: "facebook" })).toBe(true);
  });
});
