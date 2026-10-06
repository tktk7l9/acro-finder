import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

// next/font needs the Next build pipeline; stand in with plain class names.
vi.mock("next/font/local", () => ({
  default: () => ({ variable: "font-en" }),
}));
vi.mock("next/font/google", () => ({
  JetBrains_Mono: () => ({ variable: "font-mono" }),
}));

import RootLayout, { metadata, viewport } from "./layout";

describe("root layout", () => {
  // <html>/<body> cannot be mounted inside a jsdom container, so the layout is
  // rendered to markup, which is also how the server emits it.
  const html = renderToStaticMarkup(
    <RootLayout>
      <main>child</main>
    </RootLayout>,
  );

  it("declares a Japanese document carrying the font variables", () => {
    expect(html).toMatch(/<html lang="ja" class="font-en font-mono">/);
    expect(html).toContain("<main>child</main>");
  });

  it("ships the shared SNS icon sprite before the page", () => {
    expect(html.indexOf('<symbol id="sns-web"')).toBeGreaterThan(-1);
    expect(html.indexOf("<symbol")).toBeLessThan(html.indexOf("<main>"));
  });

  it("writes no script tag, so the HTML has no external script without SRI", () => {
    // The analytics beacon is appended after hydration by components/Analytics.tsx.
    // A <script src> to static.cloudflareinsights.com here costs the Observatory SRI test.
    expect(html).not.toContain("<script");
    expect(html).not.toContain("cloudflareinsights");
  });

  it("titles pages with the site suffix and describes the app", () => {
    expect(metadata.title).toEqual({
      default: "ACRO/FINDER · アクロバット練習施設マップ",
      template: "%s · ACRO/FINDER",
    });
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(viewport.themeColor).toBe("#0e0f0d");
  });
});
