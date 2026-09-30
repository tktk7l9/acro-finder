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

export const CONTACT_SUBJECTS = [
  "掲載・修正の依頼",
  "PR掲載（特集枠）について",
  "予約・月謝管理ツールの先行案内",
  "その他",
] as const;

// Anchors the owner-page CTAs link to. Each sits at the top of the contact
// form, so the link scrolls there natively and the form reads the subject off
// the hash (SHIG 40, 42): the CTA that brought the user here picks the subject.
export const CONTACT_ANCHORS: { id: string; subject: (typeof CONTACT_SUBJECTS)[number] }[] = [
  { id: "contact-listing", subject: "掲載・修正の依頼" },
  { id: "contact-pr", subject: "PR掲載（特集枠）について" },
  { id: "contact-tool", subject: "予約・月謝管理ツールの先行案内" },
];

export function subjectForAnchor(hash: string): string | undefined {
  const id = hash.replace(/^#/, "");
  return CONTACT_ANCHORS.find((a) => a.id === id)?.subject;
}
