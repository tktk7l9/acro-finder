import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { DetailPanel } from "./DetailPanel";
import { FACILITIES } from "@/lib/data";

const withHours = FACILITIES.find((f) => f.hours)!; // f03 — has an hours table
const coreOnly = FACILITIES.find((f) => !f.hours && !f.lessons)!; // a core-only facility
const noWeb = FACILITIES.find((f) => !f.links.web)!;
const withPhone = FACILITIES.find((f) => f.phone)!;
const dashLeadTime = FACILITIES.find((f) => f.booking?.leadTime === "—")!;

describe("DetailPanel", () => {
  it("renders nothing without a facility", () => {
    const { container } = render(<DetailPanel facility={null} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders core sections for any facility", () => {
    const f = FACILITIES[0];
    const { getAllByText, getByText } = render(<DetailPanel facility={f} onClose={() => {}} />);
    expect(getAllByText(f.name).length).toBeGreaterThan(0);
    expect(getByText("施設について")).toBeTruthy();
    expect(getByText(f.address)).toBeTruthy();
  });

  it("renders the hours section when hours are present", () => {
    const { getByText } = render(<DetailPanel facility={withHours} onClose={() => {}} />);
    expect(getByText("営業時間")).toBeTruthy();
  });

  it("omits optional sections when the data is absent", () => {
    const { queryByText } = render(<DetailPanel facility={coreOnly} onClose={() => {}} />);
    expect(queryByText("営業時間")).toBeNull();
    expect(queryByText("レッスン")).toBeNull();
  });

  it("fires onClose when the close button is clicked", () => {
    const onClose = vi.fn();
    const { container } = render(<DetailPanel facility={FACILITIES[0]} onClose={onClose} />);
    fireEvent.click(container.querySelector(".detail-close") as HTMLElement);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("toggles the favorite star through the parent", () => {
    const onToggle = vi.fn();
    const { container, rerender } = render(
      <DetailPanel facility={FACILITIES[0]} onClose={() => {}} onToggleFavorite={onToggle} />,
    );
    const favBtn = container.querySelector(".detail-cta .fav-btn") as HTMLElement;
    expect(favBtn.textContent).toContain("☆");
    expect(favBtn.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(favBtn);
    expect(onToggle).toHaveBeenCalledOnce();
    rerender(
      <DetailPanel facility={FACILITIES[0]} onClose={() => {}} favorite onToggleFavorite={onToggle} />,
    );
    expect(favBtn.textContent).toContain("★");
    expect(favBtn.getAttribute("aria-pressed")).toBe("true");
  });

  describe("SHIG review", () => {
    it("labels the close button", () => {
      const { container } = render(<DetailPanel facility={FACILITIES[0]} onClose={() => {}} />);
      expect(container.querySelector(".detail-close")?.getAttribute("aria-label")).toBe("閉じる");
    });

    // SHIG 1: photos[] never carries an image, so the section was always a placeholder.
    it("has no placeholder-only photos section", () => {
      const { queryByText } = render(<DetailPanel facility={FACILITIES[0]} onClose={() => {}} />);
      expect(queryByText("施設内")).toBeNull();
    });

    // SHIG 1: "—" is a placeholder, not information.
    it("hides booking cells whose value is a dash placeholder", () => {
      const { queryByText } = render(<DetailPanel facility={dashLeadTime} onClose={() => {}} />);
      expect(queryByText("予約期限")).toBeNull();
    });

    // SHIG 47/11: the button opens the facility's own site — say so.
    it("names the booking link after where it goes", () => {
      const { getByText, queryByText } = render(
        <DetailPanel facility={FACILITIES[0]} onClose={() => {}} />,
      );
      expect(getByText("公式サイトで予約").closest("a")?.getAttribute("href")).toBe(
        FACILITIES[0].links.web,
      );
      expect(queryByText("予約する")).toBeNull();
    });

    // SHIG 37: a permanently disabled button with no reason is noise.
    it("omits the booking button when there is no official site", () => {
      const { queryByText } = render(<DetailPanel facility={noWeb} onClose={() => {}} />);
      expect(queryByText("公式サイトで予約")).toBeNull();
      expect(queryByText("予約する")).toBeNull();
    });

    // SHIG 22/30: call straight from the panel on a phone.
    it("makes the phone number a tel: link", () => {
      const { container } = render(<DetailPanel facility={withPhone} onClose={() => {}} />);
      const tel = container.querySelector('a[href^="tel:"]');
      expect(tel?.getAttribute("href")).toBe(`tel:${withPhone.phone!.replace(/[^\d+]/g, "")}`);
    });

    // SHIG 56/28: the distance base point is stated.
    it("states where the distance is measured from", () => {
      const { container, rerender } = render(
        <DetailPanel facility={FACILITIES[0]} onClose={() => {}} />,
      );
      expect(container.textContent).toContain("東京駅から");
      rerender(<DetailPanel facility={FACILITIES[0]} onClose={() => {}} located />);
      expect(container.textContent).toContain("現在地から");
    });
  });
});
