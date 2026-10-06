import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { __resetAfterLoad, useAfterLoad } from "./after-load";

function Probe() {
  return <span>{useAfterLoad() ? "ready" : "waiting"}</span>;
}

function setReadyState(state: DocumentReadyState) {
  Object.defineProperty(document, "readyState", { configurable: true, get: () => state });
}

describe("useAfterLoad", () => {
  beforeEach(() => {
    __resetAfterLoad();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    setReadyState("complete");
  });

  it("is false on the server", () => {
    expect(renderToString(<Probe />)).toContain("waiting");
  });

  it("turns true on the next idle tick when the page has already loaded", () => {
    setReadyState("complete");
    const { container } = render(<Probe />);
    expect(container.textContent).toBe("waiting");
    act(() => {
      vi.runAllTimers();
    });
    expect(container.textContent).toBe("ready");
  });

  it("waits for the window load event while the page is still loading", () => {
    setReadyState("loading");
    const { container } = render(<Probe />);
    act(() => {
      vi.runAllTimers();
    });
    expect(container.textContent).toBe("waiting");
    act(() => {
      window.dispatchEvent(new Event("load"));
      vi.runAllTimers();
    });
    expect(container.textContent).toBe("ready");
  });

  it("uses requestIdleCallback when the browser has it", () => {
    setReadyState("complete");
    const ric = vi.fn((cb: () => void) => {
      cb();
      return 1;
    });
    vi.stubGlobal("requestIdleCallback", ric);
    const { container } = render(<Probe />);
    expect(ric).toHaveBeenCalledWith(expect.any(Function), { timeout: 2000 });
    expect(container.textContent).toBe("ready");
  });

  it("starts out true for a component mounted after the flag is set", () => {
    setReadyState("complete");
    render(<Probe />);
    act(() => {
      vi.runAllTimers();
    });
    const { container } = render(<Probe />);
    expect(container.textContent).toBe("ready");
  });
});
