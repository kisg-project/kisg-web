import { describe, expect, it } from "vitest";
import { activationSchema, changePasswordSchema, profileSchema } from "./account";

describe("profileSchema", () => {
  it("menormalkan nomor HP ke E.164", () => {
    expect(profileSchema.parse({ fullName: " Budi ", phone: "0812-3456-7890" })).toEqual({
      fullName: "Budi",
      phone: "+6281234567890",
    });
  });

  it("menolak nomor HP tidak valid", () => {
    const result = profileSchema.safeParse({ fullName: "Budi", phone: "12345" });
    expect(result.error?.issues[0]?.message).toMatch(/Nomor HP tidak valid/);
  });
});

describe("activationSchema", () => {
  const base = { fullName: "Budi", phone: "081234567890" };

  it("akun undangan wajib membuat password", () => {
    const result = activationSchema.safeParse({ ...base, needsPassword: true });
    expect(result.error?.issues[0]?.message).toBe("Buat password untuk akun Anda.");
  });

  it("akun lama boleh tanpa password", () => {
    expect(activationSchema.safeParse({ ...base, needsPassword: false }).success).toBe(true);
  });

  it("password harus sesuai aturan dan konfirmasinya sama", () => {
    const short = activationSchema.safeParse({
      ...base,
      needsPassword: true,
      password: "pendek",
      confirm: "pendek",
    });
    expect(short.error?.issues[0]?.message).toBe("Password minimal 10 karakter.");
    const mismatch = activationSchema.safeParse({
      ...base,
      needsPassword: true,
      password: "Rahasia2026x",
      confirm: "Rahasia2026y",
    });
    expect(mismatch.error?.issues[0]?.message).toBe("Konfirmasi password tidak sama.");
  });
});

describe("changePasswordSchema", () => {
  it("password baru tidak boleh sama dengan yang lama", () => {
    const result = changePasswordSchema.safeParse({
      current: "Rahasia2026x",
      password: "Rahasia2026x",
      confirm: "Rahasia2026x",
    });
    expect(result.error?.issues[0]?.message).toMatch(/tidak boleh sama/);
  });
});
