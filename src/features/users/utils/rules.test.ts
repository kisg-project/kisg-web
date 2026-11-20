import { describe, expect, it } from "vitest";
import { manageProblem } from "./rules";

const base = {
  actorId: "a",
  targetId: "b",
  targetRoles: ["marketing"] as const,
};

describe("manageProblem", () => {
  it("owner boleh mengelola akun lain, termasuk memberi role owner", () => {
    expect(manageProblem({ ...base, actorRoles: ["owner"] })).toBeNull();
    expect(manageProblem({ ...base, actorRoles: ["owner"], targetRoles: ["owner"] })).toBeNull();
    expect(manageProblem({ ...base, actorRoles: ["owner"], nextRoles: ["owner"] })).toBeNull();
  });

  it("akun admin lama boleh mengelola akun selain owner", () => {
    expect(manageProblem({ ...base, actorRoles: ["admin"] })).toBeNull();
    expect(manageProblem({ ...base, actorRoles: ["admin"], nextRoles: ["owner"] })).toMatch(
      /hanya bisa diubah oleh owner/,
    );
  });

  it("role lain ditolak, walaupun rangkap jabatan", () => {
    expect(manageProblem({ ...base, actorRoles: ["marketing_manager", "finance"] })).toMatch(
      /tidak punya akses/,
    );
  });

  it("akun sendiri tidak bisa diubah", () => {
    expect(manageProblem({ ...base, actorRoles: ["owner"], targetId: "a" })).toMatch(
      /akun sendiri/,
    );
  });

  it("multi role: akun yang memegang owner hanya bisa diubah owner", () => {
    expect(
      manageProblem({ ...base, actorRoles: ["admin"], targetRoles: ["finance", "owner"] }),
    ).toMatch(/hanya bisa diubah oleh owner/);
  });
});
