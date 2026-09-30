import { describe, it, expect } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { Photo } from "./Photo";

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

  // SHIG 1: the facility name already sits next to the thumbnail, so repeating
  // "〇〇 — 写真準備中" on every placeholder is noise.
  it("drops the placeholder caption when the type glyph stands in for the photo", () => {
    const { queryByText } = render(
      <Photo data={{ label: "施設A — 写真準備中", color: "ok-slate" }} type="parkour" />,
    );
    expect(queryByText("施設A — 写真準備中")).toBeNull();
  });

  // A jimcdn image would otherwise set a third-party __cf_bm cookie.
  it("loads cookie-setting hosts as anonymous CORS requests", () => {
    const { container } = render(
      <Photo
        data={{ label: "x", color: "ok-lime" }}
        src="https://image.jimcdn.com/app/cms/image/x.jpg"
      />,
    );
    expect(container.querySelector("img")?.getAttribute("crossorigin")).toBe("anonymous");
  });

  it("keeps other hosts as plain image requests", () => {
    const { container } = render(
      <Photo data={{ label: "x", color: "ok-lime" }} src="https://example.test/x.jpg" />,
    );
    expect(container.querySelector("img")?.hasAttribute("crossorigin")).toBe(false);
  });

  it("falls back to the placeholder when the hotlinked image fails to load", () => {
    const { container } = render(
      <Photo
        data={{ label: "施設A — 写真準備中", color: "ok-slate" }}
        src="https://example.test/broken.jpg"
        type="tricking"
      />,
    );
    fireEvent.error(container.querySelector("img")!);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector(".photo-glyph")?.textContent).toBe("✦");
  });

  it("uses a generic glyph for an unknown type", () => {
    const { container } = render(
      <Photo data={{ label: "x", color: "ok-slate" }} type="trampoline" />,
    );
    expect(container.querySelector(".photo-glyph")?.textContent).toBe("◆");
  });
});
