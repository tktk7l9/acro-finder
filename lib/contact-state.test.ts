import { describe, it, expect } from "vitest";
import { validateContactField, initialContactState } from "./contact-state";

describe("validateContactField", () => {
  it("name: non-empty, up to 100 chars", () => {
    expect(validateContactField("name", "")).toBe(false);
    expect(validateContactField("name", "   ")).toBe(false);
    expect(validateContactField("name", "山田")).toBe(true);
    expect(validateContactField("name", "x".repeat(101))).toBe(false);
  });
  it("email: requires a plausible address", () => {
    expect(validateContactField("email", "foo@bar.com")).toBe(true);
    expect(validateContactField("email", "nope")).toBe(false);
    expect(validateContactField("email", "a@b")).toBe(false);
  });
  it("subject: non-empty, up to 150 chars", () => {
    expect(validateContactField("subject", "掲載・修正の依頼")).toBe(true);
    expect(validateContactField("subject", "")).toBe(false);
  });
  it("message: between 10 and 5000 chars", () => {
    expect(validateContactField("message", "短い")).toBe(false);
    expect(validateContactField("message", "これは十分な長さのメッセージ本文です")).toBe(true);
    expect(validateContactField("message", "x".repeat(5001))).toBe(false);
  });
  it("starts in the idle state", () => {
    expect(initialContactState.status).toBe("idle");
    expect(initialContactState.formError).toBeNull();
  });
});
