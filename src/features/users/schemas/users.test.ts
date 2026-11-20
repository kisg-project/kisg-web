import { describe, expect, it } from "vitest";
import { inviteUserSchema, setUserRolesSchema } from "./users";

const valid = {
  fullName: "Budi Santoso",
  email: "Budi@KISGroup.co.id",
  roles: ["finance", "marketing"],
  primaryRole: "finance",
};

describe("inviteUserSchema", () => {
  it("menerima multi role dan menormalkan email", () => {
    const parsed = inviteUserSchema.parse(valid);
    expect(parsed.email).toBe("budi@kisgroup.co.id");
    expect(parsed.roles).toEqual(["finance", "marketing"]);
  });

  it("role admin tidak bisa dipilih lagi", () => {
    expect(
      inviteUserSchema.safeParse({ ...valid, roles: ["admin"], primaryRole: "admin" }).success,
    ).toBe(false);
  });

  it("minimal satu role dan role utama harus termasuk", () => {
    const empty = inviteUserSchema.safeParse({ ...valid, roles: [] });
    expect(empty.error?.issues[0]?.message).toBe("Pilih minimal satu role.");
    const wrongPrimary = inviteUserSchema.safeParse({ ...valid, primaryRole: "owner" });
    expect(wrongPrimary.error?.issues[0]?.message).toBe(
      "Role utama harus termasuk role yang dipilih.",
    );
  });
});

describe("setUserRolesSchema", () => {
  it("menolak role dobel", () => {
    const result = setUserRolesSchema.safeParse({
      userId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      roles: ["marketing", "marketing"],
      primaryRole: "marketing",
    });
    expect(result.success).toBe(false);
  });
});
