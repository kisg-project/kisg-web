import { describe, expect, it } from "vitest";
import { forgotPasswordSchema, loginSchema, newPasswordSchema } from "./auth";

function messages(result: { success: boolean; error?: { issues: { message: string }[] } }) {
  return result.error?.issues.map((issue) => issue.message) ?? [];
}

describe("loginSchema", () => {
  it("menerima email dan password, email dirapikan ke huruf kecil", () => {
    const result = loginSchema.parse({ email: "  Nama@KISGroup.co.id ", password: "x" });
    expect(result.email).toBe("nama@kisgroup.co.id");
  });

  it("email kosong hanya memberi satu pesan", () => {
    const result = loginSchema.safeParse({ email: "", password: "x" });
    expect(messages(result)).toEqual(["Isi email."]);
  });

  it("menolak format email salah", () => {
    const result = loginSchema.safeParse({ email: "nama@", password: "x" });
    expect(messages(result)).toEqual(["Format email tidak valid. Contoh: nama@kisgroup.co.id."]);
  });

  it("menolak password kosong", () => {
    const result = loginSchema.safeParse({ email: "a@kisgroup.co.id", password: "" });
    expect(messages(result)).toEqual(["Isi password."]);
  });
});

describe("forgotPasswordSchema", () => {
  it("hanya butuh email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "a@kisgroup.co.id" }).success).toBe(true);
  });
});

describe("newPasswordSchema", () => {
  it("menerima password yang memenuhi aturan Supabase", () => {
    const result = newPasswordSchema.safeParse({ password: "Rahasia2026", confirm: "Rahasia2026" });
    expect(result.success).toBe(true);
  });

  it.each([
    ["Pendek1A", "Password minimal 10 karakter."],
    ["semuakecil123", "Password harus memuat huruf besar."],
    ["SEMUABESAR123", "Password harus memuat huruf kecil."],
    ["TanpaAngkaSama", "Password harus memuat angka."],
  ])("menolak %s", (password, message) => {
    const result = newPasswordSchema.safeParse({ password, confirm: password });
    expect(messages(result)).toContain(message);
  });

  it("menolak konfirmasi yang berbeda", () => {
    const result = newPasswordSchema.safeParse({ password: "Rahasia2026", confirm: "Rahasia2027" });
    expect(result.error?.issues[0]?.path).toEqual(["confirm"]);
  });
});
