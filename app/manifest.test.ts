import { describe, it, expect } from "vitest";
import manifest from "./manifest";

describe("manifest", () => {
  it("describes an installable Japanese standalone app", () => {
    const m = manifest();
    expect(m.short_name).toBe("ACRO/FINDER");
    expect(m.lang).toBe("ja");
    expect(m.display).toBe("standalone");
    expect(m.start_url).toBe("/");
    expect(m.icons?.map((i) => i.src)).toEqual(["/icon.svg", "/apple-icon"]);
  });
});
