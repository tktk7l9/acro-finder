import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
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

  describe("SHIG review", () => {
    afterEach(() => vi.unstubAllGlobals());

    // SHIG 94: keyboard users can open a skill.
    it("opens a skill from the keyboard", () => {
      const { container } = render(<SkillsApp />);
      const card = container.querySelector(".skl-card") as HTMLElement;
      expect(card.getAttribute("role")).toBe("button");
      expect(card.tabIndex).toBe(0);
      fireEvent.keyDown(card, { key: "Enter" });
      expect(container.querySelector(".skl-panel.open")).toBeTruthy();
    });

    it("does not open the card when Enter is pressed on its star button", () => {
      const { container } = render(<SkillsApp />);
      fireEvent.keyDown(container.querySelector(".skl-card .skl-card-iconbtn") as HTMLElement, {
        key: "Enter",
      });
      expect(container.querySelector(".skl-panel.open")).toBeNull();
    });

    // SHIG 54/57: clearing acts at once and can be undone.
    it("clears the combo with an undo notice", () => {
      const { container, getByText, queryByText } = render(<SkillsApp />);
      fireEvent.click(container.querySelector(".skl-card") as HTMLElement);
      fireEvent.click(container.querySelector(".skl-sp-addcombo") as HTMLElement);
      fireEvent.click(getByText("クリア"));
      expect(container.querySelectorAll(".skl-combo-slot")).toHaveLength(0);
      // The disabled クリア button would strand keyboard focus; undo takes it.
      expect(document.activeElement?.textContent).toBe("元に戻す");
      fireEvent.click(getByText("元に戻す"));
      expect(container.querySelectorAll(".skl-combo-slot")).toHaveLength(1);
      expect(queryByText("元に戻す")).toBeNull();
      expect(JSON.parse(localStorage.getItem("acro_skill_combo")!)).toHaveLength(1);
    });

    // SHIG 82: on a phone the builder starts folded so the list is visible.
    it("starts the combo builder folded on narrow screens", () => {
      vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("max-width"), media: q }));
      const { getByText } = render(<SkillsApp />);
      expect(getByText("▲ 展開")).toBeTruthy();
    });

    it("keeps the combo builder open on wide screens", () => {
      vi.stubGlobal("matchMedia", (q: string) => ({ matches: false, media: q }));
      const { getByText } = render(<SkillsApp />);
      expect(getByText("▼ 折りたたみ")).toBeTruthy();
    });

    it("exposes the favourite / learned filters' state", () => {
      const { getByText } = render(<SkillsApp />);
      const fav = getByText(/お気に入り/).closest("button") as HTMLElement;
      expect(fav.getAttribute("aria-pressed")).toBe("false");
      fireEvent.click(fav);
      expect(fav.getAttribute("aria-pressed")).toBe("true");
    });
  });
});
