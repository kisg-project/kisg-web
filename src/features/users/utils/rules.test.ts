import { describe, expect, it } from "vitest";
import { manageProblem } from "./rules";

const base = { actorId: "a", targetId: "b", targetRole: "marketing" as const };

describe("manageProblem", () => {
  it("admin dan owner boleh mengelola akun lain", () => {
    expect(manageProblem({ ...base, actorRole: "admin" })).toBeNull();
    expect(manageProblem({ ...base, actorRole: "owner", targetRole: "owner" })).toBeNull();
    expect(manageProblem({ ...base, actorRole: "admin", nextRole: "owner" })).toBeNull();
  });

  it("role lain ditolak", () => {
    expect(manageProblem({ ...base, actorRole: "marketing_manager" })).toMatch(/tidak punya akses/);
  });

  it("akun sendiri tidak bisa diubah", () => {
    expect(manageProblem({ ...base, actorRole: "admin", targetId: "a" })).toMatch(/akun sendiri/);
  });

  it("akun owner hanya bisa diubah owner", () => {
    expect(manageProblem({ ...base, actorRole: "admin", targetRole: "owner" })).toMatch(
      /hanya bisa diubah oleh owner/,
    );
  });
});
