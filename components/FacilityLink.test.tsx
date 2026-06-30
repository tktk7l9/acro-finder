import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { FacilityLink } from "./FacilityLink";
import { FACILITIES } from "@/lib/data";

describe("FacilityLink", () => {
  it("links to the facility detail page and shows name + area", () => {
    const f = FACILITIES[0];
    const { container, getByText } = render(<FacilityLink facility={f} />);
    const a = container.querySelector("a") as HTMLAnchorElement;
    expect(a.getAttribute("href")).toBe(`/facilities/${f.id}`);
    expect(getByText(f.name)).toBeTruthy();
    expect(getByText(f.area)).toBeTruthy();
  });

  it("caps the visible tags at three", () => {
    const many = { ...FACILITIES[0], tags: ["a", "b", "c", "d", "e"] };
    const { container } = render(<FacilityLink facility={many} />);
    expect(container.querySelectorAll(".fac-tags span")).toHaveLength(3);
  });
});
