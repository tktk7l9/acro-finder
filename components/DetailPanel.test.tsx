import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
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

  describe("optional data", () => {
    const rich = {
      ...FACILITIES[0],
      rating: 4.5,
      reviewCount: 8,
      isOpen: false,
      priceDay: "1日券 ¥4,000",
      booking: { required: false, walkIn: true, methods: ["電話"], leadTime: "前日 18:00 まで" },
      lessons: { available: false, types: [], schedule: "", price: "" },
      payment: ["現金", "謎の支払い"],
      links: {
        web: "https://rich.example.test",
        instagram: "@rich_ig",
        twitter: "@rich_x",
        youtube: "@rich_yt",
        tiktok: "@rich_tt",
      },
    };

    it("shows rating with review count, open status and the day price", () => {
      const { container } = render(<DetailPanel facility={rich} onClose={() => {}} />);
      expect(container.querySelector(".rating")?.textContent).toContain("4.5");
      expect(screen.getByText("8件")).toBeInTheDocument();
      expect(container.querySelector(".status-pill.closed")).toBeTruthy();
      expect(screen.getByText("1日券 ¥4,000")).toBeInTheDocument();
    });

    it("shows a real booking lead time and a walk-in friendly facility", () => {
      render(<DetailPanel facility={rich} onClose={() => {}} />);
      expect(screen.getByText("予約期限")).toBeInTheDocument();
      expect(screen.getByText("前日 18:00 まで")).toBeInTheDocument();
      expect(screen.getByText("○ 予約不要")).toBeInTheDocument();
      expect(screen.getByText("可能")).toBeInTheDocument();
    });

    it("says lessons are not offered", () => {
      render(<DetailPanel facility={rich} onClose={() => {}} />);
      expect(screen.getByText("○ なし")).toBeInTheDocument();
      expect(screen.getByText(/フリー練習のみの施設です/)).toBeInTheDocument();
    });

    it("falls back to a generic icon for an unknown payment method", () => {
      const { container } = render(<DetailPanel facility={rich} onClose={() => {}} />);
      expect(container.querySelector(".pay-cell.pay-other .pay-name")?.textContent).toBe(
        "謎の支払い",
      );
    });

    it("links every SNS profile", () => {
      const { container } = render(<DetailPanel facility={rich} onClose={() => {}} />);
      const hrefs = [...container.querySelectorAll(".link-row")].map((a) => a.getAttribute("href"));
      expect(hrefs).toEqual([
        "https://rich.example.test",
        "https://instagram.com/rich_ig",
        "https://x.com/rich_x",
        "https://youtube.com/@rich_yt",
        "https://tiktok.com/@rich_tt",
      ]);
    });

    it("omits the links section when the facility has no link at all", () => {
      const { container } = render(
        <DetailPanel facility={{ ...FACILITIES[0], links: {} }} onClose={() => {}} />,
      );
      expect(container.querySelector(".link-row")).toBeNull();
      expect(screen.getByRole("link", { name: "経路を見る" })).toHaveAttribute(
        "href",
        `https://www.google.com/maps/dir/?api=1&destination=${FACILITIES[0].lat},${FACILITIES[0].lng}`,
      );
    });

    it("links to the full facility page", () => {
      render(<DetailPanel facility={FACILITIES[0]} onClose={() => {}} />);
      expect(screen.getByRole("link", { name: "詳細・アクセス情報ページを開く →" })).toHaveAttribute(
        "href",
        "/facilities/f01",
      );
    });
  });
});
