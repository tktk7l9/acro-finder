import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import SkillsPage, { metadata } from "./page";

describe("skills page", () => {
  it("renders the skills app", () => {
    render(<SkillsPage />);
    expect(screen.getByPlaceholderText("技名・タグで検索（⌘K）")).toBeInTheDocument();
    expect(screen.getByText("コンボビルダー")).toBeInTheDocument();
  });

  it("has a title", () => {
    expect(metadata.title).toBe("技ガイド / スキルリスト");
  });
});
