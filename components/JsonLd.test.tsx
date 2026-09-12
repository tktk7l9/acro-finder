import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { JsonLd } from "./JsonLd";

describe("JsonLd", () => {
  it("serializes data into an ld+json script", () => {
    const { container } = render(<JsonLd data={{ "@type": "Thing", name: "x" }} />);
    const script = container.querySelector('script[type="application/ld+json"]') as HTMLScriptElement;
    expect(script).toBeTruthy();
    expect(JSON.parse(script.innerHTML)).toMatchObject({ "@type": "Thing", name: "x" });
  });

  it("escapes < so embedded strings cannot break out of the script", () => {
    const { container } = render(<JsonLd data={{ name: "</script><b>" }} />);
    const script = container.querySelector("script") as HTMLScriptElement;
    expect(script.innerHTML).not.toContain("</script>");
    expect(JSON.parse(script.innerHTML).name).toBe("</script><b>");
  });
});
