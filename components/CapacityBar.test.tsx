import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { CapacityBar } from "./CapacityBar";

describe("CapacityBar", () => {
  it("renders a normal fill below 80%", () => {
    const { container } = render(<CapacityBar entered={9} capacity={20} />);
    const fill = container.querySelector(".capacity-bar-fill") as HTMLElement;
    expect(fill.style.width).toBe("45%");
    expect(fill.className).not.toContain("warn");
    expect(fill.className).not.toContain("full");
  });
  it("marks a warning fill at 80% or above", () => {
    const { container } = render(<CapacityBar entered={58} capacity={64} />);
    const fill = container.querySelector(".capacity-bar-fill") as HTMLElement;
    expect(fill.className).toContain("warn");
  });
  it("marks a full fill at 100%", () => {
    const { container, getByText } = render(<CapacityBar entered={40} capacity={40} />);
    const fill = container.querySelector(".capacity-bar-fill") as HTMLElement;
    expect(fill.style.width).toBe("100%");
    expect(fill.className).toContain("full");
    expect(getByText("100%")).toBeTruthy();
  });
});
