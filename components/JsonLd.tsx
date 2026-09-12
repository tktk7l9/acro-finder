// Renders a schema.org payload as a <script type="application/ld+json">.
// ld+json はデータブロックで実行されないため CSP script-src の対象外で、nonce は要らない。
// `<` is escaped so embedded strings can never break out of the script element.
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
