import { describe, it, expect, vi } from "vitest";
import { fireEvent, render } from "@testing-library/react";

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

  // A field's error text is tied to the field, so it is read together with it.
  it("links a blur-validation error to its field", () => {
    const { container } = render(<ContactForm />);
    const name = container.querySelector('input[name="name"]') as HTMLInputElement;
    expect(name.getAttribute("aria-describedby")).toBeNull();
    fireEvent.blur(name);
    expect(name.getAttribute("aria-invalid")).toBe("true");
    const id = name.getAttribute("aria-describedby")!;
    expect(document.getElementById(id)?.textContent).toBe("お名前を入力してください");
  });
});
