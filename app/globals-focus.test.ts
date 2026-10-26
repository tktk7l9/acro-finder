import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// The search box and the prefecture select set `outline: none` in their own
// rules, which outranks the shared `:where(...):focus-visible` ring, and their
// focus border step (--line to --line-2) is too faint to see (WCAG 2.4.7).
describe("globals.css keyboard focus", () => {
  const css = readFileSync(join(import.meta.dirname, "globals.css"), "utf8");
  for (const selector of [".search input:focus-visible", ".pref-select:focus-visible"]) {
    it(`draws the accent ring on ${selector}`, () => {
      const start = css.indexOf(`${selector} {`);
      expect(start).toBeGreaterThan(-1);
      const rule = css.slice(start, css.indexOf("}", start));
      expect(rule).toContain("outline: 2px solid var(--accent)");
    });
  }
});
