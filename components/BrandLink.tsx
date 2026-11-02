// The ACRO/FINDER wordmark linking home, shared by every page header except the
// map (where it is the page's h1, not a link).
// No aria-label: the link is named by the wordmark and tagline it shows, so
// speech-input users can say what they see (WCAG 2.5.3 Label in Name). The
// "A" mark is decoration and stays out of the name.
export function BrandLink() {
  return (
    <a href="/" className="brand">
      <div className="brand-mark" aria-hidden="true">
        A
      </div>
      <div>
        ACRO<span style={{ color: "var(--ink-3)" }}>/</span>FINDER
        <div className="jp">アクロバット練習施設</div>
      </div>
    </a>
  );
}
