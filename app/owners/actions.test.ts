import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ContactFormState } from "@/lib/contact-state";

const requestHeaders = new Map<string, string>();
vi.mock("next/headers", () => ({
  headers: async () => ({ get: (k: string) => requestHeaders.get(k) ?? null }),
}));

const send = vi.fn();
vi.mock("resend", () => ({
  Resend: class {
    emails = { send };
  },
}));

import { submitContactForm } from "./actions";

const prev: ContactFormState = { status: "idle", fieldErrors: {}, formError: null };

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [k, v] of Object.entries(fields)) data.set(k, v);
  return data;
}
const valid = {
  name: "齋藤",
  email: "owner@example.test",
  subject: "掲載・修正の依頼",
  message: "掲載情報の修正をお願いします。",
};

// Each test gets its own client IP so the module-level rate buckets never
// bleed between tests; the fixed window is 10 minutes.
let ipCounter = 0;
beforeEach(() => {
  requestHeaders.clear();
  requestHeaders.set("x-forwarded-for", `10.0.0.${++ipCounter}, 203.0.113.1`);
  send.mockReset();
  send.mockResolvedValue({ error: null });
  vi.stubEnv("RESEND_API_KEY", "re_test");
  vi.stubEnv("RESEND_TO_EMAIL", "inbox@example.test");
  vi.stubEnv("RESEND_FROM_EMAIL", "");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("submitContactForm", () => {
  it("pretends to succeed when the honeypot is filled, without sending", async () => {
    const state = await submitContactForm(prev, form({ ...valid, website: "http://spam" }));
    expect(state.status).toBe("success");
    expect(send).not.toHaveBeenCalled();
  });

  it("reports every invalid field and sends nothing", async () => {
    const state = await submitContactForm(
      prev,
      form({ name: " ", email: "nope", subject: "", message: "短い" }),
    );
    expect(state).toEqual({
      status: "error",
      fieldErrors: { name: true, email: true, subject: true, message: true },
      formError: null,
    });
    expect(send).not.toHaveBeenCalled();
  });

  it("reports a config error when Resend is not set up", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const state = await submitContactForm(prev, form(valid));
    expect(state.formError).toBe("config");
    expect(send).not.toHaveBeenCalled();
  });

  it("sends the message with reply-to set to the sender", async () => {
    vi.stubEnv("RESEND_FROM_EMAIL", "ACRO <noreply@example.test>");
    const state = await submitContactForm(prev, form(valid));
    expect(state).toEqual({ status: "success", fieldErrors: {}, formError: null });
    expect(send).toHaveBeenCalledOnce();
    const mail = send.mock.calls[0][0];
    expect(mail.from).toBe("ACRO <noreply@example.test>");
    expect(mail.to).toBe("inbox@example.test");
    expect(mail.replyTo).toBe(valid.email);
    expect(mail.subject).toBe("[ACRO/FINDER 掲載] 掲載・修正の依頼");
    expect(mail.text).toContain("お名前: 齋藤");
    expect(mail.text).toContain(valid.message);
  });

  it("falls back to the Resend onboarding sender when the from address is blank", async () => {
    // RESEND_FROM_EMAIL is stubbed to "" in beforeEach — a set-but-empty
    // variable, which is what a blank secret looks like at runtime.
    await submitContactForm(prev, form(valid));
    expect(send.mock.calls[0][0].from).toBe("ACRO/FINDER <onboarding@resend.dev>");
  });

  it("reports a server error when Resend rejects the mail", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    send.mockResolvedValue({ error: { message: "boom" } });
    const state = await submitContactForm(prev, form(valid));
    expect(state.formError).toBe("server");
  });

  it("reports a server error when sending throws", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    send.mockRejectedValue(new Error("network"));
    const state = await submitContactForm(prev, form(valid));
    expect(state.formError).toBe("server");
  });

  it("rate-limits the fourth submission from the same IP within the window", async () => {
    for (let i = 0; i < 3; i++) {
      expect((await submitContactForm(prev, form(valid))).status).toBe("success");
    }
    const fourth = await submitContactForm(prev, form(valid));
    expect(fourth).toEqual({ status: "error", fieldErrors: {}, formError: "rate" });
    expect(send).toHaveBeenCalledTimes(3);
  });

  it("falls back to x-real-ip, then to a shared bucket", async () => {
    requestHeaders.clear();
    requestHeaders.set("x-real-ip", "198.51.100.7");
    expect((await submitContactForm(prev, form(valid))).status).toBe("success");
    requestHeaders.clear();
    expect((await submitContactForm(prev, form(valid))).status).toBe("success");
  });

  it("opens a fresh window once the previous one has expired", async () => {
    vi.useFakeTimers();
    try {
      for (let i = 0; i < 3; i++) await submitContactForm(prev, form(valid));
      expect((await submitContactForm(prev, form(valid))).formError).toBe("rate");
      vi.advanceTimersByTime(10 * 60_000 + 1);
      expect((await submitContactForm(prev, form(valid))).status).toBe("success");
    } finally {
      vi.useRealTimers();
    }
  });
});
