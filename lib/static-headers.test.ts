import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// public/_headers is applied by Workers Assets to files it serves directly
// (/_next/static/* and public/), which bypass headers() in next.config.ts. Pin
// the rules so a rewrite of the file cannot silently drop them.
const rules = readFileSync("public/_headers", "utf8");

function block(path: string): string {
  const lines = rules.split("\n");
  const start = lines.indexOf(path);
  expect(start, `rule block for ${path}`).toBeGreaterThanOrEqual(0);
  const body: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (!line.startsWith("  ")) break;
    body.push(line.trim());
  }
  return body.join("\n");
}

describe("public/_headers", () => {
  it("caches hashed Next.js assets as immutable", () => {
    expect(block("/_next/static/*")).toContain("Cache-Control: public, max-age=31536000, immutable");
  });

  it("keeps nosniff on every file served without the Worker's headers", () => {
    expect(block("/*")).toContain("X-Content-Type-Options: nosniff");
  });

  it("names each header in exactly one block (duplicates are comma-joined by Workers Assets)", () => {
    const names = rules
      .split("\n")
      .filter((l) => l.startsWith("  "))
      .map((l) => l.trim().split(":")[0]);
    expect(new Set(names).size).toBe(names.length);
  });
});
