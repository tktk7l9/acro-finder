import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { FacilityCard } from "./FacilityCard";
import { FACILITIES } from "@/lib/data";

const fac = (id: string) => FACILITIES.find((f) => f.id === id)!;
const mission = fac("f01"); // lessons + booking + 3 SNS links
const ptv = fac("f02"); //     5 SNS links
const hero = fac("f04"); //    core-only (no lessons/booking), 1 SNS link

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

  it("fires onClick on Enter and Space for keyboard users", () => {
    const onClick = vi.fn();
    const { container } = render(
      <FacilityCard facility={mission} active={false} onClick={onClick} />,
    );
    const card = container.querySelector(".card") as HTMLElement;
    expect(card.getAttribute("role")).toBe("button");
    expect(card.tabIndex).toBe(0);
    fireEvent.keyDown(card, { key: "Enter" });
    fireEvent.keyDown(card, { key: " " });
    expect(onClick).toHaveBeenCalledTimes(2);
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
});
