import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Breadcrumb } from "./Breadcrumb";

describe("Breadcrumb", () => {
  const items = [
    { name: "ホーム", href: "/" },
    { name: "施設一覧", href: "/facilities" },
    { name: "東京都", href: "/area/tokyo" },
  ];

  it("links every crumb except the current (last) one", () => {
    const { container, getByText } = render(<Breadcrumb items={items} />);
    expect(container.querySelector('a[href="/"]')).toBeTruthy();
    expect(container.querySelector('a[href="/facilities"]')).toBeTruthy();
    expect(container.querySelector('a[href="/area/tokyo"]')).toBeNull();
    expect(getByText("東京都").getAttribute("aria-current")).toBe("page");
  });
});
