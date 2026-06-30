import { describe, it, expect, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { SkillsApp } from "./SkillsApp";
import { SKILLS } from "@/lib/skills-data";

const genreTab = (container: HTMLElement, label: string) =>
  [...container.querySelectorAll(".skl-genre-tab")].find((b) =>
    b.textContent?.includes(label),
  ) as HTMLElement;

describe("SkillsApp", () => {
  beforeEach(() => localStorage.clear());

  it("renders all 160 skill cards initially", () => {
    const { container } = render(<SkillsApp />);
    expect(container.querySelectorAll(".skl-card")).toHaveLength(160);
  });

  it("filters cards by genre", () => {
    const { container } = render(<SkillsApp />);
    const parkourCount = SKILLS.filter((s) => s.genre === "parkour").length;
    fireEvent.click(genreTab(container, "パルクール"));
    expect(container.querySelectorAll(".skl-card")).toHaveLength(parkourCount);
  });

  it("filters cards by search query", () => {
    const { container } = render(<SkillsApp />);
    const input = container.querySelector(
      ".skills-app .search input",
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "windmill" } });
    const n = container.querySelectorAll(".skl-card").length;
    expect(n).toBeGreaterThan(0);
    expect(n).toBeLessThan(160);
  });

  it("opens the detail panel when a card is clicked", () => {
    const { container } = render(<SkillsApp />);
    expect(container.querySelector(".skl-panel.open")).toBeNull();
    fireEvent.click(container.querySelector(".skl-card") as HTMLElement);
    expect(container.querySelector(".skl-panel.open")).toBeTruthy();
  });

  it("adds a skill to the combo from the detail panel", () => {
    const { container } = render(<SkillsApp />);
    fireEvent.click(container.querySelector(".skl-card") as HTMLElement);
    fireEvent.click(container.querySelector(".skl-sp-addcombo") as HTMLElement);
    expect(container.querySelectorAll(".skl-combo-slot")).toHaveLength(1);
  });
});
