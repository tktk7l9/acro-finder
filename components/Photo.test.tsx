import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Photo, Star } from "./Photo";

describe("Photo", () => {
  it("renders the label and color class", () => {
    const { container, getByText } = render(
      <Photo data={{ label: "メインフロア", color: "ok-lime" }} />,
    );
    expect(getByText("メインフロア")).toBeTruthy();
    expect(container.querySelector(".photo.ok-lime")).toBeTruthy();
  });
  it("appends an extra className", () => {
    const { container } = render(
      <Photo data={{ label: "x", color: "ok-amber" }} className="hero" />,
    );
    expect(container.querySelector(".photo.ok-amber.hero")).toBeTruthy();
  });

  it("shows a discipline glyph on the placeholder when type is given", () => {
    const { container } = render(
      <Photo data={{ label: "x", color: "ok-slate" }} type="parkour" />,
    );
    expect(container.querySelector(".photo-glyph")?.textContent).toBe("◰");
  });

  it("shows the image and no glyph when src is provided", () => {
    const { container } = render(
      <Photo data={{ label: "x", color: "ok-lime" }} src="https://example.test/x.jpg" type="mixed" />,
    );
    expect(container.querySelector("img")).toBeTruthy();
    expect(container.querySelector(".photo-glyph")).toBeNull();
  });
});

describe("Star", () => {
  it("renders an svg", () => {
    const { container } = render(<Star />);
    expect(container.querySelector("svg")).toBeTruthy();
  });
});
