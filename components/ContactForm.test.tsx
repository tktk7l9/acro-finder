import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";

// Mock the server action so jsdom doesn't import next/headers / resend.
vi.mock("@/app/owners/actions", () => ({
  submitContactForm: async () => ({ status: "idle", fieldErrors: {}, formError: null }),
}));

import { ContactForm } from "./ContactForm";

describe("ContactForm", () => {
  it("renders all required fields and the submit button", () => {
    const { container, getByText } = render(<ContactForm />);
    expect(container.querySelector('input[name="name"]')).toBeTruthy();
    expect(container.querySelector('input[name="email"]')).toBeTruthy();
    expect(container.querySelector('select[name="subject"]')).toBeTruthy();
    expect(container.querySelector('textarea[name="message"]')).toBeTruthy();
    expect(getByText("送信する")).toBeTruthy();
  });

  it("includes a honeypot field for bots", () => {
    const { container } = render(<ContactForm />);
    expect(container.querySelector('input[name="website"]')).toBeTruthy();
  });
});
