import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { StatusPill } from "./StatusPill";

describe("StatusPill", () => {
  it("shows the closing time when open", () => {
    const { container } = render(<StatusPill open closesAt="23:00" />);
    const pill = container.querySelector(".status-pill.open");
    expect(pill).toBeTruthy();
    expect(pill?.textContent).toContain("営業中");
    expect(pill?.textContent).toContain("23:00");
  });
  it("shows closed state", () => {
    const { container } = render(<StatusPill open={false} closesAt="22:00" />);
    const pill = container.querySelector(".status-pill.closed");
    expect(pill).toBeTruthy();
    expect(pill?.textContent).toContain("営業時間外");
  });
});
