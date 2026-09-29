import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { MapPlaceholder } from "./MapPlaceholder";
import { placeholderGeometry } from "@/lib/map-view";

describe("MapPlaceholder", () => {
  it("renders the static basemap eagerly with its source credit", () => {
    const { container, getByText } = render(<MapPlaceholder done={false} />);
    const img = container.querySelector("img")!;
    expect(img.getAttribute("src")).toBe("/map-placeholder.webp");
    expect(img.getAttribute("fetchpriority")).toBe("high");
    expect(img.hasAttribute("loading")).toBe(false);
    expect(img.getAttribute("alt")).toBe("");
    expect(getByText("地理院タイル")).toBeTruthy();
  });

  it("passes the image geometry to CSS", () => {
    const { container } = render(<MapPlaceholder done={false} />);
    const root = container.firstElementChild as HTMLElement;
    const g = placeholderGeometry();
    expect(root.style.getPropertyValue("--ph-w")).toBe(String(g.width));
    expect(root.style.getPropertyValue("--ph-cx")).toBe(g.centerX.toFixed(2));
    expect(root.style.getPropertyValue("--ph-cy")).toBe(g.centerY.toFixed(2));
    expect(root.getAttribute("aria-hidden")).toBe("true");
  });

  it("fades out once the live map has drawn", () => {
    const { container, rerender } = render(<MapPlaceholder done={false} />);
    expect(container.querySelector(".map-placeholder.done")).toBeNull();
    rerender(<MapPlaceholder done />);
    expect(container.querySelector(".map-placeholder.done")).toBeTruthy();
  });
});
