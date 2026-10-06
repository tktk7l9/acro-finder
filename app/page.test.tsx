import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, screen, act } from "@testing-library/react";

// The Leaflet map can't run in jsdom — stub it so the page logic is testable.
// The last props it received are kept so tests can assert what the map is told.
const mapProps: { current: Record<string, unknown> | null } = { current: null };
vi.mock("@/components/InteractiveMap", () => ({
  InteractiveMap: (props: Record<string, unknown>) => {
    mapProps.current = props;
    return null;
  },
}));

import { renderToString } from "react-dom/server";
import Page from "./page";
import { facilitiesInPrefecture, prefectureOptions } from "@/lib/areas";
import { FACILITIES } from "@/lib/data";

describe("home page", () => {
  // The page reads/writes ?q= and ?f= on the URL; reset it between tests so
  // one test's deep-link state does not leak into the next.
  beforeEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("renders a facility card for all 111 facilities", () => {
    const { container } = render(<Page />);
    expect(container.querySelectorAll(".card")).toHaveLength(111);
    expect(container.querySelector(".list-more")).toBeNull();
  });

  // The server HTML stops after 20 cards to stay small; the rest render on
  // mount. Without JavaScript the cut-off list says where the rest is (SHIG 59, 60).
  it("prerenders the first 20 cards and points to the full list", () => {
    // React separates adjacent text nodes with empty comments in server HTML.
    const html = renderToString(<Page />).replaceAll("<!-- -->", "");
    expect(html.match(/data-facility-id="/g)).toHaveLength(20);
    expect(html).toContain(
      `<p class="list-more"><a href="/facilities">ほか${FACILITIES.length - 20}件の施設は施設一覧で見られます</a></p>`,
    );
  });

  it("brings a deep-linked facility past the prerendered cards into view", () => {
    const farthest = [...FACILITIES].sort((a, b) => b.distance - a.distance)[0].id;
    const scrolled: Element[] = [];
    const orig = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function () {
      scrolled.push(this);
    };
    try {
      window.history.replaceState(null, "", `/?f=${farthest}`);
      const { container } = render(<Page />);
      const card = container.querySelector(`.card[data-facility-id="${farthest}"]`);
      expect(card?.getAttribute("aria-current")).toBe("true");
      expect(scrolled).toContain(card);
    } finally {
      Element.prototype.scrollIntoView = orig;
    }
  });

  it("filters facilities by search query", () => {
    const { container } = render(<Page />);
    const input = container.querySelector(".search input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "MISSION" } });
    const cards = container.querySelectorAll(".card");
    expect(cards.length).toBe(2);
    expect(container.textContent).toContain("MISSION PARKOUR PARK TOKYO");
  });

  it("shows an empty state when nothing matches", () => {
    const { container } = render(<Page />);
    const input = container.querySelector(".search input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "zzz-no-such-facility" } });
    expect(container.querySelectorAll(".card")).toHaveLength(0);
  });

  it("hydrates the search query from the ?q= URL param", () => {
    window.history.replaceState(null, "", "/?q=MISSION");
    const { container } = render(<Page />);
    const input = container.querySelector(".search input") as HTMLInputElement;
    expect(input.value).toBe("MISSION");
    expect(container.querySelectorAll(".card")).toHaveLength(2);
  });

  it("reflects the search query into the URL", () => {
    const { container } = render(<Page />);
    const input = container.querySelector(".search input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "渋谷" } });
    expect(new URLSearchParams(window.location.search).get("q")).toBe("渋谷");
  });

  // The filter/sort chips now dispatch inside startTransition so the
  // <ViewTransition> wrapping each card can animate the list changing. These
  // cover that the state still lands — a Transition that never commits would
  // leave the list untouched and is otherwise invisible.
  /** Picks one of the type chips (`.type-filters` scopes out same-named text elsewhere). */
  function typeChip(container: HTMLElement, label: string): HTMLElement {
    const chip = [...container.querySelectorAll(".type-filters .chip")].find(
      (el) => el.textContent?.trim() === label,
    );
    if (!chip) throw new Error(`type chip not found: ${label}`);
    return chip as HTMLElement;
  }

  it("filters facilities by type chip", () => {
    const { container } = render(<Page />);
    const all = container.querySelectorAll(".card").length;

    fireEvent.click(typeChip(container, "パルクール"));

    const parkour = container.querySelectorAll(".card").length;
    expect(parkour).toBeGreaterThan(0);
    expect(parkour).toBeLessThan(all);
  });

  it("returns to the full list when the すべて chip is picked again", () => {
    const { container } = render(<Page />);
    const all = container.querySelectorAll(".card").length;

    fireEvent.click(typeChip(container, "パルクール"));
    expect(container.querySelectorAll(".card").length).toBeLessThan(all);

    fireEvent.click(typeChip(container, "すべて"));
    expect(container.querySelectorAll(".card")).toHaveLength(all);
  });

  it("reorders the list when a sort chip is picked", () => {
    const { container } = render(<Page />);
    const names = () =>
      [...container.querySelectorAll(".card")].map((c) => c.textContent);
    const byDistance = names();

    const priceBtn = [...container.querySelectorAll("button")].find(
      (b) => b.textContent?.trim() === "料金",
    )!;
    fireEvent.click(priceBtn);

    // Same facilities, different order.
    const byPrice = names();
    expect(byPrice).toHaveLength(byDistance.length);
    expect(byPrice).not.toEqual(byDistance);
  });

  it("keeps a stable ViewTransition name per facility so cards are matched across filters", () => {
    const { container } = render(<Page />);
    // ViewTransition renders no DOM node of its own — the card stays the direct
    // child of the scroller, which is what the existing `.card` queries assume.
    const scroller = container.querySelector(".list-scroll")!;
    const cards = [...scroller.children].filter((el) => el.classList.contains("card"));
    expect(cards.length).toBe(container.querySelectorAll(".card").length);
  });

  describe("SHIG review", () => {
    function button(container: HTMLElement, label: string) {
      return [...container.querySelectorAll("button")].find(
        (b) => b.textContent?.trim() === label,
      ) as HTMLElement | undefined;
    }

    // SHIG 37/1: no facility has a rating, so a rating sort changes nothing.
    it("does not offer a rating sort that cannot reorder anything", () => {
      const { container } = render(<Page />);
      expect(button(container, "評価")).toBeUndefined();
    });

    // SHIG 15/56/98: before a real fix the base point is Tokyo Station.
    it("does not show a fake 現在地 pin before geolocation", () => {
      render(<Page />);
      expect(mapProps.current?.showUser).toBe(false);
    });

    it("says distances are measured from Tokyo Station until located", () => {
      const { container } = render(<Page />);
      expect(container.querySelector(".list-distance-note")?.textContent).toContain("東京駅から");
    });

    it("shows the user pin and says 現在地から once located", () => {
      const geo = {
        getCurrentPosition: (ok: (p: GeolocationPosition) => void) =>
          ok({ coords: { latitude: 35.0, longitude: 135.7 } } as GeolocationPosition),
      };
      Object.defineProperty(navigator, "geolocation", { value: geo, configurable: true });
      const { container } = render(<Page />);
      fireEvent.click(button(container, "現在地から探す")!);
      expect(mapProps.current?.showUser).toBe(true);
      expect(container.querySelector(".list-distance-note")?.textContent).toContain("現在地から");
      Reflect.deleteProperty(navigator, "geolocation");
    });

    // SHIG 55/60: the empty state offers a way out.
    it("clears every condition from the empty state", () => {
      const { container } = render(<Page />);
      fireEvent.click(typeChip(container, "パルクール"));
      const input = container.querySelector(".search input") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "zzz-no-such-facility" } });
      expect(container.querySelectorAll(".card")).toHaveLength(0);
      fireEvent.click(button(container, "条件をすべて解除")!);
      expect(input.value).toBe("");
      expect(container.querySelectorAll(".card")).toHaveLength(111);
    });

    // SHIG 60: Esc is an escape hatch from the (full-screen on phones) panel.
    it("closes the detail panel with Escape", () => {
      window.history.replaceState(null, "", "/?f=f01");
      const { container } = render(<Page />);
      expect(container.querySelector(".detail")).not.toBeNull();
      fireEvent.keyDown(window, { key: "Escape" });
      expect(container.querySelector(".detail")).toBeNull();
    });

    // Esc in the search box clears the box (native), not the open panel.
    it("keeps the panel open when Escape is pressed in the search box", () => {
      window.history.replaceState(null, "", "/?f=f01");
      const { container } = render(<Page />);
      const input = container.querySelector(".search input") as HTMLInputElement;
      fireEvent.keyDown(input, { key: "Escape" });
      expect(container.querySelector(".detail")).not.toBeNull();
    });

    // SHIG 94: closing from inside the panel returns focus to its card.
    it.each([
      ["the close button", (c: HTMLElement) => fireEvent.click(c.querySelector(".detail-close")!)],
      ["Escape", () => fireEvent.keyDown(window, { key: "Escape" })],
    ])("returns focus to the facility card when closed with %s", async (_, close) => {
      window.history.replaceState(null, "", "/?f=f01");
      const { container } = render(<Page />);
      (container.querySelector(".detail-close") as HTMLElement).focus();
      close(container);
      expect(container.querySelector(".detail")).toBeNull();
      await new Promise((r) => setTimeout(r, 0));
      expect(document.activeElement?.closest(".card")?.getAttribute("data-facility-id")).toBe("f01");
    });

    // SHIG 94: opening from a card lands focus in the panel, not on the next card.
    it("moves focus into the detail panel when a card is opened", () => {
      const { container } = render(<Page />);
      const open = container.querySelector('.card[data-facility-id="f01"] .card-open') as HTMLElement;
      open.focus();
      fireEvent.click(open);
      expect(document.activeElement?.classList.contains("detail")).toBe(true);
    });

    it("moves focus into the panel again when the open facility is re-activated", () => {
      const { container } = render(<Page />);
      const open = container.querySelector('.card[data-facility-id="f01"] .card-open') as HTMLElement;
      fireEvent.click(open);
      expect(document.activeElement?.classList.contains("detail")).toBe(true);
      // Tab back to the card, then activate it once more: no state changes.
      open.focus();
      expect(document.activeElement).toBe(open);
      fireEvent.click(open);
      expect(document.activeElement?.classList.contains("detail")).toBe(true);
    });

    it("does not steal focus when the panel is restored from the URL", () => {
      window.history.replaceState(null, "", "/?f=f01");
      const { container } = render(<Page />);
      expect(container.querySelector(".detail")).not.toBeNull();
      expect(document.activeElement).toBe(document.body);
    });

    // SHIG 94/96: toggle state is exposed, not only colour.
    it("exposes chip and sort state with aria-pressed", () => {
      const { container } = render(<Page />);
      expect(typeChip(container, "すべて").getAttribute("aria-pressed")).toBe("true");
      expect(typeChip(container, "パルクール").getAttribute("aria-pressed")).toBe("false");
      expect(button(container, "距離")!.getAttribute("aria-pressed")).toBe("true");
      const eq = container.querySelector(".eq-chip") as HTMLElement;
      expect(eq.getAttribute("aria-pressed")).toBe("false");
      fireEvent.click(eq);
      expect(eq.getAttribute("aria-pressed")).toBe("true");
    });

    it("labels the search box", () => {
      const { container } = render(<Page />);
      expect(container.querySelector(".search input")?.getAttribute("aria-label")).toBeTruthy();
    });
  
    // SHIG 37/12: a saved favourite is findable again from the list.
    it("filters to favourites and marks favourite cards", () => {
      localStorage.clear();
      window.history.replaceState(null, "", "/?f=f01");
      const { container } = render(<Page />);
      fireEvent.click(container.querySelector(".detail-cta .fav-btn") as HTMLElement);
      expect(container.querySelectorAll(".card .card-fav")).toHaveLength(1);
      const favChip = container.querySelector(".fav-chip") as HTMLElement;
      expect(favChip.textContent).toContain("1");
      fireEvent.click(favChip);
      expect(favChip.getAttribute("aria-pressed")).toBe("true");
      expect(container.querySelectorAll(".card")).toHaveLength(1);
      expect(localStorage.getItem("acro-finder:favorites")).toBe('["f01"]');
    });

    it("restores favourites saved in an earlier visit", () => {
      localStorage.setItem("acro-finder:favorites", '["f02","f03"]');
      const { container } = render(<Page />);
      expect(container.querySelectorAll(".card .card-fav")).toHaveLength(2);
      localStorage.clear();
    });

    // ── 2nd round ──

    // SHIG 5/11: the map pin shows the card's list position, so the card must
    // carry the same number (not the internal id).
    it("numbers cards in list order to match the map pins", () => {
      const { container } = render(<Page />);
      const nums = [...container.querySelectorAll(".card-thumb-num")].map((n) => n.textContent);
      expect(nums.slice(0, 3)).toEqual(["1", "2", "3"]);
      expect(container.textContent).not.toMatch(/\bF\d{2}\b/);
    });

    // SHIG 35/24: the prefecture picker narrows the list as well as moving
    // the map, so list and map show the same facilities.
    it("filters the list to the chosen prefecture and moves the map there", () => {
      const { container } = render(<Page />);
      const select = container.querySelector(".pref-select") as HTMLSelectElement;
      fireEvent.change(select, { target: { value: "神奈川県" } });
      const cards = container.querySelectorAll(".card");
      expect(cards.length).toBe(facilitiesInPrefecture("神奈川県").length);
      expect(cards.length).toBeGreaterThan(0);
      expect((mapProps.current?.focusPref as { name: string })?.name).toBe("神奈川県");
      expect(container.querySelector(".list-count")?.textContent).toContain("神奈川県");
    });

    // SHIG 13: a prefecture with no facility can only produce an empty list.
    it("offers only prefectures that have facilities, with their counts", () => {
      const { container } = render(<Page />);
      const options = [...container.querySelectorAll(".pref-select option")];
      const names = options.map((o) => (o as HTMLOptionElement).value).filter(Boolean);
      expect(names).toEqual(prefectureOptions().map((o) => o.prefecture.name));
      expect(names).not.toContain("秋田県");
      const kanagawa = options.find((o) => (o as HTMLOptionElement).value === "神奈川県");
      expect(kanagawa?.textContent).toContain(String(facilitiesInPrefecture("神奈川県").length));
    });

    it("drops the prefecture filter with 条件をすべて解除", () => {
      const { container } = render(<Page />);
      const select = container.querySelector(".pref-select") as HTMLSelectElement;
      fireEvent.change(select, { target: { value: "神奈川県" } });
      const input = container.querySelector(".search input") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "zzz-no-such-facility" } });
      fireEvent.click(button(container, "条件をすべて解除")!);
      expect(select.value).toBe("");
      expect(container.querySelectorAll(".card")).toHaveLength(111);
    });

    // SHIG 60/82: the panel covers the phone screen, so the back button must
    // close it rather than leave the site.
    it("closes the detail panel with the browser back button", async () => {
      const { container } = render(<Page />);
      fireEvent.click(container.querySelector(".card") as HTMLElement);
      expect(container.querySelector(".detail")).not.toBeNull();
      expect(window.location.search).toMatch(/^\?f=/);
      await act(async () => {
        window.history.back();
        await new Promise((r) => setTimeout(r, 10));
      });
      expect(container.querySelector(".detail")).toBeNull();
      expect(window.location.search).toBe("");
    });

    it("leaves no stale history entry when the panel is closed with ✕", async () => {
      const back = vi.spyOn(window.history, "back");
      const { container } = render(<Page />);
      fireEvent.click(container.querySelector(".card") as HTMLElement);
      await act(async () => {
        fireEvent.click(container.querySelector(".detail-close") as HTMLElement);
        await new Promise((r) => setTimeout(r, 10));
      });
      expect(back).toHaveBeenCalledTimes(1);
      expect(container.querySelector(".detail")).toBeNull();
      back.mockRestore();
    });

    // SHIG 94 × 60: a panel opened from a card closes through history.back(),
    // so the focus hand-back to the card must wait for the popstate.
    it("returns focus to the card when a card-opened panel is closed with ✕", async () => {
      const { container } = render(<Page />);
      const open = container.querySelector('.card[data-facility-id="f01"] .card-open') as HTMLElement;
      fireEvent.click(open);
      expect(document.activeElement?.classList.contains("detail")).toBe(true);
      (container.querySelector(".detail-close") as HTMLElement).focus();
      await act(async () => {
        fireEvent.click(container.querySelector(".detail-close") as HTMLElement);
        await new Promise((r) => setTimeout(r, 10));
      });
      expect(container.querySelector(".detail")).toBeNull();
      expect(window.location.search).toBe("");
      expect(document.activeElement).toBe(
        container.querySelector('.card[data-facility-id="f01"] .card-open'),
      );
    });

    // SHIG 38: on desktop the search box stays usable beside the open panel,
    // so a query typed then must survive closing the panel (which goes back
    // in history to the entry that predates the query).
    it("keeps a query typed while the panel was open after closing it", async () => {
      const { container } = render(<Page />);
      fireEvent.click(container.querySelector(".card") as HTMLElement);
      const input = container.querySelector(".search input") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "MISSION" } });
      expect(container.querySelectorAll(".card")).toHaveLength(2);
      await act(async () => {
        fireEvent.click(container.querySelector(".detail-close") as HTMLElement);
        await new Promise((r) => setTimeout(r, 10));
      });
      expect(container.querySelector(".detail")).toBeNull();
      expect(input.value).toBe("MISSION");
      expect(container.querySelectorAll(".card")).toHaveLength(2);
      expect(window.location.search).toBe("?q=MISSION");
    });

    it("does not navigate back when closing a deep-linked panel", () => {
      window.history.replaceState(null, "", "/?f=f01");
      const back = vi.spyOn(window.history, "back");
      const { container } = render(<Page />);
      fireEvent.click(container.querySelector(".detail-close") as HTMLElement);
      expect(back).not.toHaveBeenCalled();
      expect(container.querySelector(".detail")).toBeNull();
      expect(window.location.search).toBe("");
      back.mockRestore();
    });

    // SHIG 66/24: a facility picked on the map (or via ?f=) is brought into
    // view in the list, so the highlighted card is actually visible.
    it("scrolls the selected card into view", () => {
      const scrolled: Element[] = [];
      const orig = Element.prototype.scrollIntoView;
      Element.prototype.scrollIntoView = function () {
        scrolled.push(this);
      };
      try {
        const { container } = render(<Page />);
        expect(scrolled).toHaveLength(0);
        act(() => (mapProps.current?.onSelect as (id: string) => void)("f31"));
        const card = container.querySelector('.card[data-facility-id="f31"]');
        expect(scrolled).toContain(card);
      } finally {
        Element.prototype.scrollIntoView = orig;
      }
    });
  });

  describe("geolocation", () => {
    const button = (container: HTMLElement) =>
      [...container.querySelectorAll("button")].find((b) =>
        b.textContent?.includes("現在地"),
      ) as HTMLButtonElement;
    const stubGeo = (impl: (ok: PositionCallback, err: PositionErrorCallback) => void) =>
      Object.defineProperty(navigator, "geolocation", {
        value: { getCurrentPosition: impl },
        configurable: true,
      });
    const geoError = (code: number) =>
      ({ code, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 }) as GeolocationPositionError;
    afterEach(() => Reflect.deleteProperty(navigator, "geolocation"));

    it("says the browser cannot locate when the API is missing", () => {
      const { container } = render(<Page />);
      fireEvent.click(button(container));
      expect(screen.getByRole("status")).toHaveTextContent("このブラウザは位置情報に対応していません");
    });

    it.each([
      [1, "位置情報の利用が許可されていません"],
      [3, "位置情報の取得がタイムアウトしました"],
      [2, "位置情報を取得できませんでした"],
    ])("explains geolocation error code %i in plain words", (code, text) => {
      stubGeo((_ok, err) => err(geoError(code)));
      const { container } = render(<Page />);
      fireEvent.click(button(container));
      expect(screen.getByRole("status")).toHaveTextContent(text);
      expect(mapProps.current?.showUser).toBe(false);
      expect(button(container)).toBeEnabled();
    });

    it("disables the button while locating and ignores a second click", () => {
      let resolve: PositionCallback = () => {};
      stubGeo((ok) => (resolve = ok));
      const { container } = render(<Page />);
      fireEvent.click(button(container));
      expect(button(container)).toBeDisabled();
      expect(button(container).textContent).toContain("現在地を取得中…");
      fireEvent.click(button(container));
      act(() => resolve({ coords: { latitude: 35.0, longitude: 135.7 } } as GeolocationPosition));
      expect(screen.getByRole("status")).toHaveTextContent("現在地を取得しました");
      expect(screen.getByText("現在地", { selector: ".swatch.you" })).toBeInTheDocument();
      // Distance sort is picked automatically once a real position exists.
      const sortBtn = [...container.querySelectorAll("button")].find(
        (b) => b.textContent?.trim() === "距離",
      )!;
      expect(sortBtn).toHaveAttribute("aria-pressed", "true");
    });
  });

  describe("map interplay", () => {
    it("tells the map which prefecture to fly to", () => {
      const { container } = render(<Page />);
      const select = container.querySelector(".pref-select") as HTMLSelectElement;
      fireEvent.change(select, { target: { value: "大阪府" } });
      expect((mapProps.current?.focusPref as { name: string }).name).toBe("大阪府");
      expect(select.value).toBe("大阪府");
      fireEvent.change(select, { target: { value: "" } });
      expect(mapProps.current?.focusPref).toBeNull();
    });

    it("opens the panel for a marker picked on the map", () => {
      const { container } = render(<Page />);
      act(() => (mapProps.current?.onSelect as (id: string) => void)("f02"));
      expect(container.querySelector(".detail")).not.toBeNull();
      expect(container.querySelector('.card[aria-current="true"]')?.getAttribute("data-facility-id")).toBe("f02");
      expect(new URLSearchParams(window.location.search).get("f")).toBe("f02");
    });

    it("drops the placeholder once the basemap has drawn", () => {
      const { container } = render(<Page />);
      expect(container.querySelector(".map-pane")).toHaveClass("basemap-pending");
      act(() => (mapProps.current?.onBasemapReady as () => void)());
      expect(container.querySelector(".map-pane")).not.toHaveClass("basemap-pending");
    });

    it("stacks equipment filters and clears them in one tap", () => {
      const { container } = render(<Page />);
      const all = container.querySelectorAll(".card").length;
      const chips = container.querySelectorAll(".equipment-filter .eq-chip");
      fireEvent.click(chips[0]);
      fireEvent.click(chips[1]);
      const narrowed = container.querySelectorAll(".card").length;
      expect(narrowed).toBeLessThan(all);
      fireEvent.click(chips[0]);
      expect(container.querySelectorAll(".card").length).toBeGreaterThanOrEqual(narrowed);
      fireEvent.click(screen.getByText("✕ 解除"));
      expect(container.querySelectorAll(".card")).toHaveLength(all);
      expect(screen.queryByText("✕ 解除")).toBeNull();
    });

    // The card's name is a native <button> (#48), so Enter / Space open it
    // without a key handler; the panel shows the same facility.
    it("opens the panel for the facility whose name button was activated", () => {
      const { container } = render(<Page />);
      const card = container.querySelector('.card[data-facility-id="f03"]') as HTMLElement;
      const open = card.querySelector(".card-open") as HTMLButtonElement;
      expect(open.tagName).toBe("BUTTON");
      fireEvent.click(open);
      expect(container.querySelector(".detail-name")?.textContent).toBe(open.textContent);
      expect(container.querySelector('.card[aria-current="true"]')?.getAttribute("data-facility-id")).toBe("f03");
    });
  });
});
