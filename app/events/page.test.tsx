import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import EventsPage, { metadata } from "./page";

describe("events page", () => {
  it("renders the events feed", () => {
    render(<EventsPage />);
    expect(screen.getByRole("link", { name: "ACRO/FINDER ホーム" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("大会名・会場・タグで検索")).toBeInTheDocument();
  });

  it("has a title", () => {
    expect(metadata.title).toBe("イベント・大会フィード");
  });
});
