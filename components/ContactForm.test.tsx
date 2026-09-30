import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import type { ContactFormState } from "@/lib/contact-state";

// Mock the server action so jsdom doesn't import next/headers / resend.
// Each test decides what the "server" answers with.
const submitContactForm = vi.fn<
  (prev: ContactFormState, data: FormData) => Promise<ContactFormState>
>();
vi.mock("@/app/owners/actions", () => ({
  submitContactForm: (prev: ContactFormState, data: FormData) => submitContactForm(prev, data),
}));

import { ContactForm } from "./ContactForm";

const idle: ContactFormState = { status: "idle", fieldErrors: {}, formError: null };

function fillValidForm() {
  fireEvent.change(screen.getByLabelText(/お名前/), { target: { value: "齋藤" } });
  fireEvent.change(screen.getByLabelText(/メールアドレス/), {
    target: { value: "owner@example.test" },
  });
  fireEvent.change(screen.getByLabelText(/メッセージ/), {
    target: { value: "掲載情報の修正をお願いします。" },
  });
}

describe("ContactForm", () => {
  beforeEach(() => {
    submitContactForm.mockReset();
    submitContactForm.mockResolvedValue(idle);
  });

  it("renders all required fields and the submit button", () => {
    render(<ContactForm />);
    expect(screen.getByLabelText(/お名前/)).toHaveAttribute("name", "name");
    expect(screen.getByLabelText(/メールアドレス/)).toHaveAttribute("name", "email");
    expect(screen.getByLabelText(/ご用件/)).toHaveAttribute("name", "subject");
    expect(screen.getByLabelText(/メッセージ/)).toHaveAttribute("name", "message");
    expect(screen.getByRole("button", { name: "送信する" })).toBeEnabled();
  });

  it("includes a honeypot field for bots", () => {
    const { container } = render(<ContactForm />);
    const honeypot = container.querySelector('input[name="website"]');
    expect(honeypot).toBeTruthy();
    expect(honeypot?.closest('[aria-hidden="true"]')).toBeTruthy();
  });

  it("offers the four subjects with the first one preselected", () => {
    render(<ContactForm />);
    const select = screen.getByLabelText(/ご用件/) as HTMLSelectElement;
    expect(select.options).toHaveLength(4);
    expect(select.value).toBe("掲載・修正の依頼");
  });

  describe("inline validation", () => {
    it("flags an empty name on blur and clears it once typed", () => {
      render(<ContactForm />);
      const name = screen.getByLabelText(/お名前/);
      fireEvent.blur(name);
      expect(screen.getByText("お名前を入力してください")).toBeInTheDocument();
      expect(name).toHaveAttribute("aria-invalid", "true");

      fireEvent.change(name, { target: { value: "齋藤" } });
      expect(screen.queryByText("お名前を入力してください")).toBeNull();
      expect(name).not.toHaveAttribute("aria-invalid");
    });

    it("flags a malformed email on blur", () => {
      render(<ContactForm />);
      const email = screen.getByLabelText(/メールアドレス/);
      fireEvent.change(email, { target: { value: "not-an-email" } });
      fireEvent.blur(email);
      expect(screen.getByText("正しいメールアドレスを入力してください")).toBeInTheDocument();
    });

    it("flags a message shorter than 10 characters on blur", () => {
      render(<ContactForm />);
      const message = screen.getByLabelText(/メッセージ/);
      fireEvent.change(message, { target: { value: "短い" } });
      fireEvent.blur(message);
      expect(screen.getByText("10文字以上で入力してください")).toBeInTheDocument();
    });

    it("does not flag a field while typing before it was ever blurred", () => {
      render(<ContactForm />);
      const name = screen.getByLabelText(/お名前/);
      fireEvent.change(name, { target: { value: "" } });
      expect(screen.queryByText("お名前を入力してください")).toBeNull();
    });

    it("keeps the error while the value is still invalid after typing", () => {
      render(<ContactForm />);
      const message = screen.getByLabelText(/メッセージ/);
      fireEvent.blur(message);
      fireEvent.change(message, { target: { value: "まだ短い" } });
      expect(screen.getByText("10文字以上で入力してください")).toBeInTheDocument();
    });

    it("clears the error when the field is blurred with a valid value", () => {
      render(<ContactForm />);
      const name = screen.getByLabelText(/お名前/);
      fireEvent.blur(name);
      expect(screen.getByText("お名前を入力してください")).toBeInTheDocument();
      // Value set by the browser (autofill) without a change event, then blur.
      fireEvent.blur(name, { target: { value: "齋藤" } });
      expect(screen.queryByText("お名前を入力してください")).toBeNull();
    });

    it("blurring a valid field twice leaves no error", () => {
      render(<ContactForm />);
      const name = screen.getByLabelText(/お名前/);
      fireEvent.change(name, { target: { value: "齋藤" } });
      fireEvent.blur(name);
      fireEvent.blur(name);
      expect(screen.queryByText("お名前を入力してください")).toBeNull();
    });
  });

  describe("submission", () => {
    it("sends the entered values to the server action", async () => {
      const { container } = render(<ContactForm />);
      fillValidForm();
      fireEvent.submit(container.querySelector("form")!);
      await waitFor(() => expect(submitContactForm).toHaveBeenCalledOnce());
      const data = submitContactForm.mock.calls[0][1];
      expect(data.get("name")).toBe("齋藤");
      expect(data.get("email")).toBe("owner@example.test");
      expect(data.get("subject")).toBe("掲載・修正の依頼");
      expect(data.get("message")).toBe("掲載情報の修正をお願いします。");
    });

    it("shows the thank-you note and a way to send another after success", async () => {
      submitContactForm.mockResolvedValue({
        status: "success",
        fieldErrors: {},
        formError: null,
      });
      const { container } = render(<ContactForm />);
      fillValidForm();
      fireEvent.submit(container.querySelector("form")!);
      expect(await screen.findByText("お問い合わせありがとうございます。")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "別の内容を送る" })).toHaveAttribute(
        "href",
        "/owners",
      );
      expect(container.querySelector("form")).toBeNull();
    });

    it("shows server-side field errors next to their fields", async () => {
      submitContactForm.mockResolvedValue({
        status: "error",
        fieldErrors: { email: true, message: true },
        formError: null,
      });
      const { container } = render(<ContactForm />);
      fireEvent.submit(container.querySelector("form")!);
      expect(
        await screen.findByText("正しいメールアドレスを入力してください"),
      ).toBeInTheDocument();
      expect(screen.getByText("10文字以上で入力してください")).toBeInTheDocument();
      expect(screen.getByLabelText(/メールアドレス/)).toHaveAttribute("aria-invalid", "true");
      expect(screen.queryByText("お名前を入力してください")).toBeNull();
    });

    it.each([
      ["config", "現在お問い合わせを受け付けられません。お手数ですが時間をおいて再度お試しください。"],
      ["server", "送信に失敗しました。時間をおいて再度お試しください。"],
      ["rate", "送信回数が上限に達しました。しばらくしてからお試しください。"],
    ] as const)("announces the %s form error as an alert", async (formError, text) => {
      submitContactForm.mockResolvedValue({ status: "error", fieldErrors: {}, formError });
      const { container } = render(<ContactForm />);
      fillValidForm();
      fireEvent.submit(container.querySelector("form")!);
      expect(await screen.findByRole("alert")).toHaveTextContent(text);
    });

    it("disables the button and says 送信中 while the action is pending", async () => {
      let resolve: (s: ContactFormState) => void = () => {};
      submitContactForm.mockImplementation(
        () => new Promise<ContactFormState>((r) => (resolve = r)),
      );
      const { container } = render(<ContactForm />);
      fillValidForm();
      fireEvent.submit(container.querySelector("form")!);
      const pending = await screen.findByRole("button", { name: "送信中…" });
      expect(pending).toBeDisabled();
      resolve(idle);
      expect(await screen.findByRole("button", { name: "送信する" })).toBeEnabled();
    });
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
