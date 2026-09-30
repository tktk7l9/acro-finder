import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import NotFound, { metadata } from "./not-found";

// SHIG 60 / 11: the 404 is in the user's language and leads back into the app.
describe("not-found page", () => {
  it("explains the situation in Japanese and offers two ways back", () => {
    render(<NotFound />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("ページが見つかりません");
    expect(screen.getByRole("link", { name: "施設マップで探す" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "都道府県別の一覧を見る" })).toHaveAttribute(
      "href",
      "/facilities",
    );
  });

  it("is kept out of search indexes", () => {
    expect(metadata.robots).toEqual({ index: false });
  });
});
