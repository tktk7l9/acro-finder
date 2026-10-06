import { describe, expect, it } from "vitest";
import { BEACON_SRC, BEACON_TOKEN } from "./analytics";
import { contentSecurityPolicy } from "./csp";

describe("analytics beacon", () => {
  const origin = new URL(BEACON_SRC).origin;

  it("loads from an origin script-src allows on Worker responses and hashed static pages", () => {
    // Without 'strict-dynamic' an appended script is allowed by its origin, so a mismatch
    // here only blocks the beacon, silently (a CSP violation in the console).
    for (const policy of [
      contentSecurityPolicy(),
      contentSecurityPolicy({ scriptHashes: ["sha256-AAA="] }),
      contentSecurityPolicy({ scriptHashes: ["sha256-AAA="], meta: true }),
    ]) {
      expect(policy).toMatch(new RegExp(`script-src [^;]*${origin}( |;)`));
      expect(policy).toMatch(/connect-src [^;]*https:\/\/cloudflareinsights\.com( |;)/);
    }
  });

  it("has a 32-digit hex site token", () => {
    expect(BEACON_TOKEN).toMatch(/^[0-9a-f]{32}$/);
  });
});
