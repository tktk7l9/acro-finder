import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, fireEvent, screen, within } from "@testing-library/react";
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
      // The card is not a control itself: its name is a native <button>, so
      // the ★ / ✓ buttons are not nested inside a role=button.
      expect(card.getAttribute("role")).toBeNull();
      const open = card.querySelector(".skl-card-open") as HTMLButtonElement;
      expect(open.tagName).toBe("BUTTON");
      fireEvent.click(open);
      expect(container.querySelector(".skl-panel.open")).toBeTruthy();
    });

    // SHIG 94: the graph nodes are keyboard stops, not pointer-only targets.
    it("opens a skill from a graph node with Enter", () => {
      const { container, getByRole } = render(<SkillsApp />);
      fireEvent.click(getByRole("button", { name: "❖ 相関図" }));
      const node = container.querySelector(".skl-graph-node") as SVGGElement;
      expect(node.getAttribute("tabindex")).toBe("0");
      expect(node.getAttribute("role")).toBe("button");
      fireEvent.keyDown(node, { key: "Enter" });
      const name = container.querySelector(".skl-panel.open .skl-sp-name")?.textContent;
      expect(name).toBeTruthy();
      expect(node.getAttribute("aria-label")).toContain(name as string);
      expect(node.getAttribute("aria-pressed")).toBe("true");
    });

    it("moves the level slider with the arrow keys", () => {
      const { getByLabelText, getByText } = render(<SkillsApp />);
      const min = getByLabelText("難易度の下限");
      expect(min.getAttribute("aria-valuenow")).toBe("1");
      fireEvent.keyDown(min, { key: "ArrowRight" });
      expect(min.getAttribute("aria-valuenow")).toBe("2");
      expect(getByText("Lv.2")).toBeTruthy();
      fireEvent.keyDown(min, { key: "Home" });
      expect(min.getAttribute("aria-valuenow")).toBe("1");
      const max = getByLabelText("難易度の上限");
      fireEvent.keyDown(max, { key: "ArrowLeft" });
      expect(max.getAttribute("aria-valuenow")).toBe("9");
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

  describe("filters and sorting", () => {
    const cardNames = (container: HTMLElement) =>
      [...container.querySelectorAll(".skl-card-name")].map((el) => el.textContent);
    const cardLevels = (container: HTMLElement) =>
      [...container.querySelectorAll(".skl-card-lv .n")].map((el) => Number(el.textContent));

    it("shows the filtered / total count", () => {
      const { container } = render(<SkillsApp />);
      expect(container.querySelector(".skl-fb-count")?.textContent).toBe("160 / 160");
      fireEvent.click(genreTab(container, "スキー"));
      const ski = SKILLS.filter((s) => s.genre === "ski").length;
      expect(container.querySelector(".skl-fb-count")?.textContent).toBe(
        `${String(ski).padStart(2, "0")} / 160`,
      );
    });

    it("narrows the list to skills carrying a picked tag, and widens on a second click", () => {
      const { container } = render(<SkillsApp />);
      const chip = container.querySelector(".skl-tag-chip") as HTMLElement;
      const tag = chip.textContent!;
      fireEvent.click(chip);
      expect(chip).toHaveClass("active");
      const expected = SKILLS.filter((s) => s.tags.includes(tag)).length;
      expect(container.querySelectorAll(".skl-card")).toHaveLength(expected);
      fireEvent.click(chip);
      expect(chip).not.toHaveClass("active");
      expect(container.querySelectorAll(".skl-card")).toHaveLength(160);
    });

    it("sorts by level descending, A→Z and genre", () => {
      const { container } = render(<SkillsApp />);
      const select = container.querySelector(".skl-select") as HTMLSelectElement;

      const asc = cardLevels(container);
      expect(asc).toEqual([...asc].sort((a, b) => a - b));

      fireEvent.change(select, { target: { value: "lv-desc" } });
      const desc = cardLevels(container);
      expect(desc).toEqual([...desc].sort((a, b) => b - a));

      fireEvent.change(select, { target: { value: "az" } });
      const en = [...container.querySelectorAll(".skl-card-name-en")].map((el) => el.textContent!);
      expect(en).toEqual([...en].sort((a, b) => a.localeCompare(b)));

      fireEvent.change(select, { target: { value: "genre" } });
      const first = cardNames(container)[0];
      const breakFirst = [...SKILLS]
        .filter((s) => s.genre === "break")
        .sort((a, b) => a.lv - b.lv)[0];
      expect(first).toBe(breakFirst.name_ja);
    });

    it("shows the description only in list layout", () => {
      const { container } = render(<SkillsApp />);
      expect(container.querySelector(".skl-card-desc")).toBeNull();
      fireEvent.click(screen.getByText("▤ List"));
      expect(container.querySelector(".skl-grid.list")).toBeTruthy();
      expect(container.querySelectorAll(".skl-card-desc").length).toBe(160);
      fireEvent.click(screen.getByText("▦ Grid"));
      expect(container.querySelector(".skl-grid.list")).toBeNull();
    });

    it("switches to the relationship graph and opens a skill from a node", () => {
      const { container } = render(<SkillsApp />);
      fireEvent.click(screen.getByText("❖ 相関図"));
      expect(container.querySelector("svg.skl-graph")).toBeTruthy();
      expect(container.querySelector(".skl-card")).toBeNull();
      fireEvent.click(container.querySelector(".skl-graph-node") as Element);
      expect(container.querySelector(".skl-panel.open")).toBeTruthy();
      expect(container.querySelector(".skl-graph-node.sel")).toBeTruthy();
    });

    it("shows the empty state when nothing matches", () => {
      const { container } = render(<SkillsApp />);
      fireEvent.change(container.querySelector(".search input") as HTMLInputElement, {
        target: { value: "zzz-no-such-skill" },
      });
      expect(screen.getByText("該当する技が見つかりません")).toBeInTheDocument();
      expect(container.querySelector(".skl-card")).toBeNull();
    });

    it("moves the level range from the slider thumbs", () => {
      const { container } = render(<SkillsApp />);
      const track = container.querySelector(".skl-lv-track") as HTMLElement;
      track.getBoundingClientRect = () =>
        ({ left: 0, width: 900, top: 0, height: 10, right: 900, bottom: 10 }) as DOMRect;
      const [minThumb, maxThumb] = container.querySelectorAll(".skl-lv-thumb");

      // Drag the min thumb to the middle → Lv.5 lower bound.
      fireEvent.mouseDown(minThumb);
      fireEvent.mouseMove(window, { clientX: 400 });
      fireEvent.mouseUp(window);
      expect(screen.getByText("Lv.5")).toBeInTheDocument();
      expect(cardLevels(container).every((lv) => lv >= 5)).toBe(true);

      // A move after mouseup does nothing.
      fireEvent.mouseMove(window, { clientX: 0 });
      expect(screen.getByText("Lv.5")).toBeInTheDocument();

      // Drag the max thumb down by touch → Lv.7 upper bound (clamped to ≥ min).
      fireEvent.touchStart(maxThumb);
      fireEvent.touchMove(window, { touches: [{ clientX: 600 }] });
      fireEvent.touchEnd(window);
      expect(screen.getByText("Lv.7")).toBeInTheDocument();
      expect(cardLevels(container).every((lv) => lv >= 5 && lv <= 7)).toBe(true);

      // The max thumb cannot cross below the min.
      fireEvent.touchStart(maxThumb);
      fireEvent.touchMove(window, { touches: [{ clientX: 0 }] });
      fireEvent.touchEnd(window);
      expect(screen.getAllByText("Lv.5")).toHaveLength(2);
    });

    it("filters to favourites and to learned skills", () => {
      const { container } = render(<SkillsApp />);
      const cards = container.querySelectorAll(".skl-card");
      fireEvent.click(within(cards[0] as HTMLElement).getByLabelText("お気に入り"));
      fireEvent.click(within(cards[1] as HTMLElement).getByLabelText("習得済み"));
      expect(screen.getByText("★ お気に入り 1")).toBeInTheDocument();
      expect(screen.getByText("✓ 習得済み 1")).toBeInTheDocument();

      fireEvent.click(screen.getByText("★ お気に入り 1"));
      expect(container.querySelectorAll(".skl-card")).toHaveLength(1);
      expect(container.querySelector(".skl-card-iconbtn.fav.active")).toBeTruthy();
      fireEvent.click(screen.getByText("★ お気に入り 1"));

      fireEvent.click(screen.getByText("✓ 習得済み 1"));
      expect(container.querySelectorAll(".skl-card")).toHaveLength(1);
      expect(container.querySelector(".skl-card-iconbtn.done.active")).toBeTruthy();

      // Toggling again removes the mark and the filter now shows nothing.
      fireEvent.click(within(container.querySelector(".skl-card") as HTMLElement).getByLabelText("習得済み"));
      expect(container.querySelectorAll(".skl-card")).toHaveLength(0);
      expect(screen.getByText("✓ 習得済み 0")).toBeInTheDocument();
    });

    it("clicking a card's star does not open its panel", () => {
      const { container } = render(<SkillsApp />);
      fireEvent.click(container.querySelector(".skl-card .skl-card-iconbtn.fav") as HTMLElement);
      expect(container.querySelector(".skl-panel.open")).toBeNull();
    });
  });

  describe("detail panel", () => {
    const openSkill = (container: HTMLElement, id: string) => {
      const skill = SKILLS.find((s) => s.id === id)!;
      const card = [...container.querySelectorAll(".skl-card")].find(
        (c) => c.querySelector(".skl-card-id")?.textContent === id,
      ) as HTMLElement;
      fireEvent.click(card);
      return skill;
    };

    it("shows the skill's name, level, tips and video search link", () => {
      const { container } = render(<SkillsApp />);
      const skill = openSkill(container, "back-tuck");
      const panel = container.querySelector(".skl-panel.open") as HTMLElement;
      expect(within(panel).getByText(skill.name_ja)).toBeInTheDocument();
      expect(within(panel).getByText(`${skill.lv}/10`)).toBeInTheDocument();
      expect(within(panel).getByText(`${skill.tips_ja.length} pts`)).toBeInTheDocument();
      for (const tip of skill.tips_ja) expect(within(panel).getByText(tip)).toBeInTheDocument();
      const link = within(panel).getByRole("link", { name: "▶ YouTubeで動画を見る" });
      expect(link.getAttribute("href")).toContain(encodeURIComponent("Back Tuck tricking tutorial"));
    });

    it("jumps between prerequisite and derived skills", () => {
      const { container } = render(<SkillsApp />);
      openSkill(container, "back-tuck");
      const panel = () => container.querySelector(".skl-panel.open") as HTMLElement;
      // back-tuck ← round-off
      fireEvent.click(within(panel()).getByText("ラウンドオフ"));
      expect(panel().querySelector(".skl-sp-name")?.textContent).toBe("ラウンドオフ");
      expect(within(panel()).getByText("前提技なし — 基礎技")).toBeInTheDocument();
      // round-off → back-handspring
      fireEvent.click(within(panel()).getByText("バックタック"));
      expect(panel().querySelector(".skl-sp-name")?.textContent).toBe("バックタック");
    });

    it("says when a skill has no derived skills", () => {
      const { container } = render(<SkillsApp />);
      openSkill(container, "back-full");
      expect(screen.getByText("派生技なし")).toBeInTheDocument();
    });

    it("toggles favourite and learned from the panel", () => {
      const { container } = render(<SkillsApp />);
      openSkill(container, "back-tuck");
      fireEvent.click(screen.getByText("☆ お気に入り"));
      expect(screen.getByText("★ お気に入り")).toHaveClass("active");
      expect(screen.getByText("★ お気に入り 1")).toBeInTheDocument();
      fireEvent.click(screen.getByText("✓ 習得済み"));
      expect(screen.getByText("✓ 習得済み 1")).toBeInTheDocument();
      expect(JSON.parse(localStorage.getItem("acro_skill_favs")!)).toEqual(["back-tuck"]);
      expect(JSON.parse(localStorage.getItem("acro_skill_dones")!)).toEqual(["back-tuck"]);
    });

    it("closes with the ✕ button and with Escape", () => {
      const { container } = render(<SkillsApp />);
      openSkill(container, "back-tuck");
      fireEvent.click(screen.getByLabelText("閉じる"));
      expect(container.querySelector(".skl-panel.open")).toBeNull();
      openSkill(container, "back-tuck");
      fireEvent.keyDown(window, { key: "Escape" });
      expect(container.querySelector(".skl-panel.open")).toBeNull();
    });

    it("focuses the search box on ⌘K", () => {
      const { container } = render(<SkillsApp />);
      const input = container.querySelector(".search input") as HTMLInputElement;
      expect(document.activeElement).not.toBe(input);
      fireEvent.keyDown(window, { key: "k", metaKey: true });
      expect(document.activeElement).toBe(input);
    });
  });

  describe("combo builder", () => {
    const addFirstCard = (container: HTMLElement) => {
      fireEvent.click(container.querySelector(".skl-card") as HTMLElement);
      fireEvent.click(container.querySelector(".skl-sp-addcombo") as HTMLElement);
    };

    it("lists slots in order, sums the levels and removes a slot", () => {
      const { container } = render(<SkillsApp />);
      addFirstCard(container);
      addFirstCard(container);
      const first = SKILLS.filter((s) => s.lv === 1)[0];
      expect(container.querySelectorAll(".skl-combo-slot")).toHaveLength(2);
      expect(screen.getByText("#01")).toBeInTheDocument();
      expect(screen.getByText("#02")).toBeInTheDocument();
      expect(screen.getByText("COMBO BUILDER · 2/12")).toBeInTheDocument();
      const stats = container.querySelectorAll(".skl-combo-stat strong");
      expect(stats[0].textContent).toBe("2");
      expect(stats[1].textContent).toBe(String(first.lv * 2));

      fireEvent.click(screen.getAllByLabelText("削除")[0]);
      expect(container.querySelectorAll(".skl-combo-slot")).toHaveLength(1);
    });

    it("refuses a 13th skill and says the combo is full", () => {
      const { container } = render(<SkillsApp />);
      for (let i = 0; i < 12; i++) addFirstCard(container);
      const add = container.querySelector(".skl-sp-addcombo") as HTMLButtonElement;
      expect(add).toBeDisabled();
      expect(add.textContent).toContain("コンボが満員です");
      expect(container.querySelectorAll(".skl-combo-slot")).toHaveLength(12);
    });

    it("folds and unfolds", () => {
      const { container } = render(<SkillsApp />);
      fireEvent.click(screen.getByText("▼ 折りたたみ"));
      expect(container.querySelector(".skl-combo.collapsed")).toBeTruthy();
      expect(container.querySelector(".skl-combo-strip")).toBeNull();
      fireEvent.click(screen.getByText("▲ 展開"));
      expect(container.querySelector(".skl-combo-strip")).toBeTruthy();
    });

    it("restores the combo, favourites and learned marks from an earlier visit", () => {
      localStorage.setItem("acro_skill_combo", JSON.stringify(["back-tuck", "aerial"]));
      localStorage.setItem("acro_skill_favs", JSON.stringify(["aerial"]));
      localStorage.setItem("acro_skill_dones", JSON.stringify(["round-off", "aerial"]));
      const { container } = render(<SkillsApp />);
      expect(container.querySelectorAll(".skl-combo-slot")).toHaveLength(2);
      expect(screen.getByText("★ お気に入り 1")).toBeInTheDocument();
      expect(screen.getByText("✓ 習得済み 2")).toBeInTheDocument();
    });

    it("ignores corrupt saved state", () => {
      localStorage.setItem("acro_skill_combo", "{not json");
      localStorage.setItem("acro_skill_favs", "{not json");
      const { container } = render(<SkillsApp />);
      expect(container.querySelectorAll(".skl-combo-slot")).toHaveLength(0);
      expect(screen.getByText("★ お気に入り 0")).toBeInTheDocument();
    });

    it("drops a saved id that no longer exists instead of keeping a hidden slot", () => {
      localStorage.setItem("acro_skill_combo", JSON.stringify(["gone-skill", "back-tuck", 7]));
      localStorage.setItem("acro_skill_favs", JSON.stringify(["gone-skill", "aerial"]));
      const { container } = render(<SkillsApp />);
      expect(container.querySelectorAll(".skl-combo-slot")).toHaveLength(1);
      expect(screen.getByText("COMBO BUILDER · 1/12")).toBeInTheDocument();
      expect(screen.getByText("★ お気に入り 1")).toBeInTheDocument();
      // The cleaned list is what gets written back.
      expect(JSON.parse(localStorage.getItem("acro_skill_combo")!)).toEqual(["back-tuck"]);
    });

    it("ignores saved state that is not a list", () => {
      localStorage.setItem("acro_skill_combo", JSON.stringify({ id: "back-tuck" }));
      localStorage.setItem("acro_skill_dones", JSON.stringify("back-tuck"));
      const { container } = render(<SkillsApp />);
      expect(container.querySelectorAll(".skl-combo-slot")).toHaveLength(0);
      expect(screen.getByText("✓ 習得済み 0")).toBeInTheDocument();
    });

    it("adding a skill after a clear dismisses the undo notice", () => {
      const { container } = render(<SkillsApp />);
      addFirstCard(container);
      fireEvent.click(screen.getByText("クリア"));
      expect(screen.getByText("元に戻す")).toBeInTheDocument();
      fireEvent.click(container.querySelector(".skl-sp-addcombo") as HTMLElement);
      expect(screen.queryByText("元に戻す")).toBeNull();
      expect(container.querySelectorAll(".skl-combo-slot")).toHaveLength(1);
    });
  });
});
