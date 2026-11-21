import { describe, expect, it } from "vitest";
import { greetingFor } from "./greeting";

// Jam WIB = UTC + 7.
const wib = (hour: number, minute = 0) => new Date(Date.UTC(2026, 10, 20, hour - 7, minute));

describe("greetingFor", () => {
  it.each([
    [4, 0, "Selamat pagi"],
    [10, 59, "Selamat pagi"],
    [11, 0, "Selamat siang"],
    [14, 59, "Selamat siang"],
    [15, 0, "Selamat sore"],
    [17, 59, "Selamat sore"],
    [18, 0, "Selamat malam"],
    [23, 30, "Selamat malam"],
    [3, 59, "Selamat malam"],
  ])("%i.%i WIB: %s", (hour, minute, expected) => {
    expect(greetingFor(wib(hour, minute))).toBe(expected);
  });
});
