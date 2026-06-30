"use client";

import {
  type ChangeEvent,
  type FocusEvent,
  useActionState,
  useId,
  useState,
} from "react";
import { useFormStatus } from "react-dom";
import { submitContactForm } from "@/app/owners/actions";
import {
  type ContactFieldError,
  type ContactFormState,
  initialContactState,
  validateContactField,
} from "@/lib/contact-state";

const SUBJECTS = [
  "掲載・修正の依頼",
  "PR掲載（特集枠）について",
  "予約・月謝管理ツールの先行案内",
  "その他",
];

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

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? "送信中…" : "送信する"}
    </button>
  );
}

export function ContactForm() {
  const [state, formAction] = useActionState<ContactFormState, FormData>(
    submitContactForm,
    initialContactState,
  );
  const [clientErrors, setClientErrors] = useState<ClientErrors>({});
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
    <form action={formAction} noValidate className="form">
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
          onBlur={handleBlur("name")}
          onChange={handleChange("name")}
          aria-invalid={hasError("name") || undefined}
        />
        {hasError("name") && <p className="form-error">{FIELD_ERROR.name}</p>}
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
          onBlur={handleBlur("email")}
          onChange={handleChange("email")}
          aria-invalid={hasError("email") || undefined}
        />
        {hasError("email") && <p className="form-error">{FIELD_ERROR.email}</p>}
      </div>

      <div className="form-field">
        <label htmlFor={subjectId} className="form-label">
          ご用件 <span className="req">必須</span>
        </label>
        <select id={subjectId} name="subject" className="form-select" defaultValue={SUBJECTS[0]}>
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
          onBlur={handleBlur("message")}
          onChange={handleChange("message")}
          aria-invalid={hasError("message") || undefined}
        />
        {hasError("message") && <p className="form-error">{FIELD_ERROR.message}</p>}
      </div>

      {formErrorMessage && (
        <p role="alert" className="form-alert">
          {formErrorMessage}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
