// Renders a schema.org payload as a CSP-nonce'd <script type="application/ld+json">.
// `<` is escaped so embedded strings can never break out of the script element.
export function JsonLd({ data, nonce }: { data: unknown; nonce?: string }) {
  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
