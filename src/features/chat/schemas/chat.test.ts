import { describe, expect, it } from "vitest";
import { chatLeadSchema, chatRequestSchema, userText } from "./chat";

const base = {
  id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  message: { id: "m1", role: "user" as const, parts: [{ type: "text" as const, text: "Halo" }] },
};

describe("chatRequestSchema", () => {
  it("menerima pesan terakhir pengunjung", () => {
    expect(chatRequestSchema.safeParse(base).success).toBe(true);
  });

  it("menolak pesan atas nama asisten dan id percakapan yang bukan UUID", () => {
    expect(
      chatRequestSchema.safeParse({ ...base, message: { ...base.message, role: "assistant" } })
        .success,
    ).toBe(false);
    expect(chatRequestSchema.safeParse({ ...base, id: "abc" }).success).toBe(false);
  });
});

describe("userText", () => {
  it("menggabungkan bagian teks dan merapikan spasi", () => {
    const request = chatRequestSchema.parse({
      ...base,
      message: {
        ...base.message,
        parts: [
          { type: "text", text: "  Harga   rumah " },
          { type: "text", text: "berapa?" },
        ],
      },
    });
    expect(userText(request)).toBe("Harga rumah berapa?");
  });

  it("pesan kosong atau lebih dari 500 karakter ditolak", () => {
    const empty = chatRequestSchema.parse({
      ...base,
      message: { ...base.message, parts: [{ type: "text", text: "   " }] },
    });
    const long = chatRequestSchema.parse({
      ...base,
      message: { ...base.message, parts: [{ type: "text", text: "a".repeat(501) }] },
    });
    expect(userText(empty)).toBeNull();
    expect(userText(long)).toBeNull();
  });
});

describe("chatLeadSchema", () => {
  it("wajib persetujuan", () => {
    expect(
      chatLeadSchema.safeParse({ fullName: "Budi", phone: "081234567890", consent: false }).success,
    ).toBe(false);
    expect(
      chatLeadSchema.safeParse({ fullName: "Budi", phone: "081234567890", consent: true }).success,
    ).toBe(true);
  });
});
