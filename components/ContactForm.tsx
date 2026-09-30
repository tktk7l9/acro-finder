"use client";

import {
  type ChangeEvent,
  type FocusEvent,
  type FormEvent,
  startTransition,
  useActionState,
  useEffect,
  useId,
  useState,
} from "react";
import { submitContactForm } from "@/app/owners/actions";
import {
  CONTACT_ANCHORS,
  CONTACT_SUBJECTS,
  type ContactFieldError,
  type ContactFormState,
  initialContactState,
  subjectForAnchor,
  validateContactField,
} from "@/lib/contact-state";

const SUBJECTS = CONTACT_SUBJECTS;

const FIELD_ERROR: Record<ContactFieldError, string> = {
  name: "お名前を入力してください",
  email: "正しいメールアドレスを入力してください",
  subject: "ご用件を選択してください",
  message: "10文字以上で入力してください",
};

const FORM_ERROR = {
  config: "現在お問い合わせを受け付けられません。お手数ですが時間をおいて再度お試しください。",
  server: "送信に失敗しました。時間をおいて再度お試しください。",
  rate: "送信回数が上限に達しました。しばらくしてからお試しください。",
};

type ClientErrors = Partial<Record<ContactFieldError, true>>;

function SubmitButton({ pending }: { pending: boolean }) {
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? "送信中…" : "送信する"}
    </button>
  );
}

export function ContactForm() {
  const [state, formAction, pending] = useActionState<ContactFormState, FormData>(
    submitContactForm,
    initialContactState,
  );
  // Submitted from onSubmit rather than <form action>: React resets a form
  // after a form action runs, which after a failed send (mail outage, rate
  // limit) would put the subject back to its default even though the fields
  // are controlled (SHIG 38).
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => formAction(data));
  };
  const [clientErrors, setClientErrors] = useState<ClientErrors>({});
  // Controlled so a server-side failure (rate limit, mail outage) leaves what
  // the user typed in place — React resets uncontrolled fields after an
  // action, which would wipe the message (SHIG 38).
  const [values, setValues] = useState({
    name: "",
    email: "",
    subject: SUBJECTS[0] as string,
    message: "",
  });
  const setValue = (field: keyof typeof values, value: string) =>
    setValues((prev) => ({ ...prev, [field]: value }));
  // The owner-page CTAs link to per-subject anchors at the top of the form.
  useEffect(() => {
    const fromHash = () => {
      const subject = subjectForAnchor(window.location.hash);
      if (subject) setValues((prev) => ({ ...prev, subject }));
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);
  const nameId = useId();
  const emailId = useId();
  const subjectId = useId();
  const messageId = useId();

  if (state.status === "success") {
    return (
      <output className="form-success" aria-live="polite">
        <strong>お問い合わせありがとうございます。</strong>
        <span>担当者より折り返しご連絡します。</span>
        <a href="/owners">別の内容を送る</a>
      </output>
    );
  }

  const handleBlur =
    (field: ContactFieldError) =>
    (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const valid = validateContactField(field, event.currentTarget.value);
      setClientErrors((prev) => {
        if (valid) {
          if (!prev[field]) return prev;
          const next = { ...prev };
          delete next[field];
          return next;
        }
        return prev[field] ? prev : { ...prev, [field]: true };
      });
    };

  const handleChange =
    (field: ContactFieldError) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (!clientErrors[field]) return;
      if (validateContactField(field, event.currentTarget.value)) {
        setClientErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    };

  const hasError = (field: ContactFieldError) =>
    Boolean(clientErrors[field] ?? state.fieldErrors[field]);

  const formErrorMessage = state.formError ? FORM_ERROR[state.formError] : null;

  return (
    <form onSubmit={handleSubmit} noValidate className="form">
      {CONTACT_ANCHORS.map((a) => (
        <span key={a.id} id={a.id} className="form-anchor" />
      ))}
      {/* Honeypot — hidden from users, filled only by bots. */}
      <div aria-hidden="true" className="form-honeypot">
        <label htmlFor="website">Leave this field empty</label>
        <input id="website" type="text" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="form-field">
        <label htmlFor={nameId} className="form-label">
          お名前 <span className="req">必須</span>
        </label>
        <input
          id={nameId}
          name="name"
          type="text"
          required
          maxLength={100}
          autoComplete="name"
          className="form-input"
          value={values.name}
          onBlur={handleBlur("name")}
          onChange={(e) => {
            setValue("name", e.target.value);
            handleChange("name")(e);
          }}
          aria-invalid={hasError("name") || undefined}
          aria-describedby={hasError("name") ? `${nameId}-error` : undefined}
        />
        {hasError("name") && (
          <p id={`${nameId}-error`} className="form-error">
            {FIELD_ERROR.name}
          </p>
        )}
      </div>

      <div className="form-field">
        <label htmlFor={emailId} className="form-label">
          メールアドレス <span className="req">必須</span>
        </label>
        <input
          id={emailId}
          name="email"
          type="email"
          required
          maxLength={254}
          autoComplete="email"
          className="form-input"
          value={values.email}
          onBlur={handleBlur("email")}
          onChange={(e) => {
            setValue("email", e.target.value);
            handleChange("email")(e);
          }}
          aria-invalid={hasError("email") || undefined}
          aria-describedby={hasError("email") ? `${emailId}-error` : undefined}
        />
        {hasError("email") && (
          <p id={`${emailId}-error`} className="form-error">
            {FIELD_ERROR.email}
          </p>
        )}
      </div>

      <div className="form-field">
        <label htmlFor={subjectId} className="form-label">
          ご用件 <span className="req">必須</span>
        </label>
        <select
          id={subjectId}
          name="subject"
          className="form-select"
          value={values.subject}
          onChange={(e) => setValue("subject", e.target.value)}
        >
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor={messageId} className="form-label">
          メッセージ <span className="req">必須</span>
        </label>
        <textarea
          id={messageId}
          name="message"
          required
          minLength={10}
          maxLength={5000}
          rows={6}
          className="form-textarea"
          placeholder="施設名・ご相談内容など"
          value={values.message}
          onBlur={handleBlur("message")}
          onChange={(e) => {
            setValue("message", e.target.value);
            handleChange("message")(e);
          }}
          aria-invalid={hasError("message") || undefined}
          aria-describedby={hasError("message") ? `${messageId}-error` : undefined}
        />
        {hasError("message") && (
          <p id={`${messageId}-error`} className="form-error">
            {FIELD_ERROR.message}
          </p>
        )}
      </div>

      {formErrorMessage && (
        <p role="alert" className="form-alert">
          {formErrorMessage}
        </p>
      )}

      <SubmitButton pending={pending} />
    </form>
  );
}
