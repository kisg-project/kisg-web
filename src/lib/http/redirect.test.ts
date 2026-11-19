import { describe, expect, it } from "vitest";
import { relativeRedirect } from "./redirect";

describe("relativeRedirect", () => {
  it("mengirim Location relatif dengan status 307", () => {
    const response = relativeRedirect("/portal/login?error=tautan");
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("/portal/login?error=tautan");
  });

  it("bisa memakai 303 setelah POST", () => {
    expect(relativeRedirect("/portal/login", 303).status).toBe(303);
  });

  it("menolak URL luar dan protocol-relative", () => {
    expect(() => relativeRedirect("https://contoh.com")).toThrow();
    expect(() => relativeRedirect("//contoh.com")).toThrow();
  });
});
