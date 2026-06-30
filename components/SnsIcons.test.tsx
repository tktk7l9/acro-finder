import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { WebIcon, InstagramIcon, XIcon, YoutubeIcon, TiktokIcon } from "./SnsIcons";

describe("SnsIcons", () => {
  it("each platform icon renders an svg", () => {
    for (const Icon of [WebIcon, InstagramIcon, XIcon, YoutubeIcon, TiktokIcon]) {
      const { container } = render(<Icon />);
      expect(container.querySelector("svg")).toBeTruthy();
    }
  });
  it("respects a custom size", () => {
    const { container } = render(<WebIcon size={20} />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("width")).toBe("20");
  });
});
