import { describe, expect, it } from "vitest";
import { passwordStrength } from "./password-strength";

describe("passwordStrength", () => {
  it.each([
    ["", "kosong"],
    ["abc", "lemah"],
    ["abcdefghij", "lemah"],
    ["Abcdefghi1", "sedang"],
    ["Abcdefghij1!", "kuat"],
    ["Abcdefghijklmno1", "kuat"],
  ] as const)("%s: %s", (password, expected) => {
    expect(passwordStrength(password)).toBe(expected);
  });
});
