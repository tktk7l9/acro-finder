export type ContactFieldError = "name" | "email" | "subject" | "message";

export type ContactFormState = {
  status: "idle" | "success" | "error";
  fieldErrors: Partial<Record<ContactFieldError, true>>;
  formError: "server" | "config" | "rate" | null;
};

export const initialContactState: ContactFormState = {
  status: "idle",
  fieldErrors: {},
  formError: null,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateContactField(field: ContactFieldError, rawValue: string): boolean {
  const value = rawValue.trim();
  switch (field) {
    case "name":
      return value.length > 0 && value.length <= 100;
    case "email":
      return value.length > 0 && value.length <= 254 && EMAIL_RE.test(value);
    case "subject":
      return value.length > 0 && value.length <= 150;
    case "message":
      return value.length >= 10 && value.length <= 5000;
  }
}
