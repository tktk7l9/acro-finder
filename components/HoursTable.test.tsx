import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { HoursTable } from "./HoursTable";
import { todayLabel } from "@/lib/util";

const HOURS = [
  { day: "月", time: "13:00 - 23:00" },
  { day: "火", time: "13:00 - 23:00" },
  { day: "水", time: "定休日", closed: true },
  { day: "木", time: "13:00 - 23:00" },
  { day: "金", time: "13:00 - 24:00" },
  { day: "土", time: "10:00 - 22:00" },
  { day: "日", time: "10:00 - 20:00" },
];

describe("HoursTable", () => {
  it("renders a row per day", () => {
    const { container } = render(<HoursTable hours={HOURS} />);
    expect(container.querySelectorAll(".hour-row")).toHaveLength(7);
  });
  it("marks closed days", () => {
    const { container, getByText } = render(<HoursTable hours={HOURS} />);
    expect(container.querySelector(".hour-row.closed")).toBeTruthy();
    expect(getByText("定休日")).toBeTruthy();
  });
  it("highlights today's row", () => {
    const { container } = render(<HoursTable hours={HOURS} />);
    const today = container.querySelector(".hour-row.today");
    expect(today).toBeTruthy();
    expect(today?.textContent).toContain(todayLabel());
  });
});
