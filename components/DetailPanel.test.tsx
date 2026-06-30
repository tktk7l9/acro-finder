import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { DetailPanel } from "./DetailPanel";
import { FACILITIES } from "@/lib/data";

const withHours = FACILITIES.find((f) => f.hours)!; // f03 — has an hours table
const coreOnly = FACILITIES.find((f) => !f.hours && !f.lessons)!; // a core-only facility

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

  it("toggles the favorite star", () => {
    localStorage.clear();
    const { container } = render(<DetailPanel facility={FACILITIES[0]} onClose={() => {}} />);
    const favBtn = [...container.querySelectorAll(".detail-cta button")].find(
      (b) => b.textContent === "☆" || b.textContent === "★",
    ) as HTMLElement;
    expect(favBtn.textContent).toBe("☆");
    fireEvent.click(favBtn);
    expect(favBtn.textContent).toBe("★");
  });
});
