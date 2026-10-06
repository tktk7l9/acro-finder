import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
import { FacilityCard } from "./FacilityCard";
import { FACILITIES } from "@/lib/data";

const fac = (id: string) => FACILITIES.find((f) => f.id === id)!;
const mission = fac("f01"); // lessons + booking + 3 SNS links
const ptv = fac("f02"); //     5 SNS links
// Core fields only: a real entry with its operational data taken off, so the
// fixture stays core-only when the dataset gains lessons/booking for it.
const hero = { ...fac("f04"), lessons: undefined, booking: undefined, payment: undefined };

describe("FacilityCard", () => {
  it("renders name and area", () => {
    const { getByText } = render(
      <FacilityCard facility={mission} active={false} onClick={() => {}} />,
    );
    expect(getByText(mission.name)).toBeTruthy();
    expect(getByText(mission.area)).toBeTruthy();
  });

  it("fires onClick when the card is clicked", () => {
    const onClick = vi.fn();
    const { container } = render(
      <FacilityCard facility={mission} active={false} onClick={onClick} />,
    );
    fireEvent.click(container.querySelector(".card") as HTMLElement);
    expect(onClick).toHaveBeenCalledOnce();
  });

  // The name is a native <button>, so Enter / Space work without a key handler
  // and the SNS links are not nested inside a role=button (axe nested-interactive).
  it("exposes the name as the one button that opens the facility", () => {
    const onClick = vi.fn();
    const { container, getByRole } = render(
      <FacilityCard facility={mission} active={false} onClick={onClick} />,
    );
    expect(container.querySelector(".card")?.getAttribute("role")).toBeNull();
    const open = getByRole("button", { name: mission.name });
    expect(open.closest(".card")).not.toBeNull();
    fireEvent.click(open);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("applies the active class", () => {
    const { container } = render(<FacilityCard facility={mission} active onClick={() => {}} />);
    expect(container.querySelector(".card.active")).toBeTruthy();
  });

  it("renders every available SNS link", () => {
    const { container } = render(
      <FacilityCard facility={ptv} active={false} onClick={() => {}} />,
    );
    expect(container.querySelectorAll(".card-sns a")).toHaveLength(5);
  });

  it("stops SNS link clicks from bubbling to the card", () => {
    const onClick = vi.fn();
    const { container } = render(
      <FacilityCard facility={hero} active={false} onClick={onClick} />,
    );
    fireEvent.click(container.querySelector(".card-sns a") as HTMLElement);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("shows the lesson flag for a facility with lesson data", () => {
    const { getByText } = render(
      <FacilityCard facility={mission} active={false} onClick={() => {}} />,
    );
    expect(getByText("レッスン有")).toBeTruthy();
  });

  it("omits the card-flags row for a core-only facility", () => {
    const { container } = render(
      <FacilityCard facility={hero} active={false} onClick={() => {}} />,
    );
    expect(container.querySelector(".card-flags")).toBeNull();
  });

  it("marks a favourite with a labelled star", () => {
    render(<FacilityCard facility={mission} active={false} favorite onClick={() => {}} />);
    expect(screen.getByRole("img", { name: "お気に入り" })).toBeInTheDocument();
  });

  it("shows no star when the facility is not a favourite", () => {
    render(<FacilityCard facility={mission} active={false} onClick={() => {}} />);
    expect(screen.queryByRole("img", { name: "お気に入り" })).toBeNull();
  });

  it("shows rating, review count and open status when the data carries them", () => {
    const rated = {
      ...hero,
      rating: 4.25,
      reviewCount: 12,
      isOpen: true,
      closesAt: "22:00",
    };
    const { container } = render(
      <FacilityCard facility={rated} active={false} onClick={() => {}} />,
    );
    expect(container.querySelector(".rating")?.textContent).toContain("4.3");
    expect(screen.getByText("(12)")).toBeInTheDocument();
    expect(container.querySelector(".status-pill.open")?.textContent).toContain("22:00");
  });

  it("shows a rating without a review count", () => {
    const rated = { ...hero, rating: 3.9 };
    const { container } = render(
      <FacilityCard facility={rated} active={false} onClick={() => {}} />,
    );
    expect(container.querySelector(".rating")?.textContent).toContain("3.9");
    expect(screen.queryByText(/\(\d+\)/)).toBeNull();
  });

  it("shows the booking and card-payment flags", () => {
    const flagged = {
      ...hero,
      booking: { required: true, walkIn: false, methods: ["Web"], leadTime: "" },
      payment: ["現金", "クレジットカード"],
    };
    render(<FacilityCard facility={flagged} active={false} onClick={() => {}} />);
    expect(screen.getByText("要予約")).toHaveClass("req");
    expect(screen.getByText("カード可")).toBeInTheDocument();
  });

  it("says 予約不要 and フリーのみ for the opposite flags", () => {
    const flagged = {
      ...hero,
      booking: { required: false, walkIn: true, methods: [], leadTime: "" },
      lessons: { available: false, types: [], schedule: "", price: "" },
      payment: ["現金"],
    };
    render(<FacilityCard facility={flagged} active={false} onClick={() => {}} />);
    expect(screen.getByText("予約不要")).toBeInTheDocument();
    expect(screen.getByText("フリーのみ")).toBeInTheDocument();
    expect(screen.queryByText("カード可")).toBeNull();
  });

  it("links each SNS handle to its profile", () => {
    const linked = {
      ...hero,
      links: {
        web: "https://example.test",
        instagram: "@acro",
        twitter: "@acro_x",
        youtube: "@acro_yt",
        tiktok: "@acro_tt",
      },
    };
    render(<FacilityCard facility={linked} active={false} onClick={() => {}} />);
    expect(screen.getByRole("link", { name: "Instagram" })).toHaveAttribute(
      "href",
      "https://instagram.com/acro",
    );
    expect(screen.getByRole("link", { name: "X" })).toHaveAttribute("href", "https://x.com/acro_x");
    expect(screen.getByRole("link", { name: "YouTube" })).toHaveAttribute(
      "href",
      "https://youtube.com/@acro_yt",
    );
    expect(screen.getByRole("link", { name: "TikTok" })).toHaveAttribute(
      "href",
      "https://tiktok.com/@acro_tt",
    );
  });

  it("keeps every SNS link's click from selecting the card", () => {
    const onClick = vi.fn();
    const linked = {
      ...hero,
      links: { web: "https://e.test", instagram: "@a", twitter: "@b", youtube: "@c", tiktok: "@d" },
    };
    const { container } = render(
      <FacilityCard facility={linked} active={false} onClick={onClick} />,
    );
    const links = container.querySelectorAll(".card-sns a");
    expect(links).toHaveLength(5);
    for (const a of links) fireEvent.click(a);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("does not re-render for a new onClick closure but does for a facility change", () => {
    const { rerender, container } = render(
      <FacilityCard facility={mission} active={false} onClick={() => {}} />,
    );
    rerender(<FacilityCard facility={mission} active={false} onClick={() => {}} />);
    expect(container.querySelector(".card.active")).toBeNull();
    rerender(<FacilityCard facility={mission} active onClick={() => {}} />);
    expect(container.querySelector(".card.active")).toBeTruthy();
  });
});

describe("FacilityCard list number (SHIG 5, 11)", () => {
  // The map pin carries the card's position in the list; the card must show
  // the same number, not the internal id.
  it("shows the list position instead of the facility id", () => {
    const { container } = render(
      <FacilityCard facility={mission} index={17} active={false} onClick={() => {}} />,
    );
    const num = container.querySelector(".card-thumb-num");
    expect(num?.textContent).toBe("17");
    expect(container.textContent).not.toContain("F01");
  });
});
