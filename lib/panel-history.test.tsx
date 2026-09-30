import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useState } from "react";
import { usePanelHistory } from "./panel-history";

// A minimal page: `?p=<id>` opens a panel.
function usePanelPage() {
  const [id, setId] = useState<string | null>(() =>
    new URLSearchParams(window.location.search).get("p"),
  );
  const close = usePanelHistory({
    panelOpen: id !== null,
    search: id ? `?p=${id}` : "",
    restore: (sp) => {
      const next = sp.get("p");
      setId(next);
      return next !== null;
    },
  });
  return { id, setId, close };
}

// jsdom fires popstate from history.back() on a later task.
const popped = () => new Promise((r) => setTimeout(r, 10));

describe("usePanelHistory (SHIG 60, 82)", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("pushes an entry when the panel opens and replaces while it stays open", () => {
    const push = vi.spyOn(window.history, "pushState");
    const replace = vi.spyOn(window.history, "replaceState");
    const { result } = renderHook(usePanelPage);
    act(() => result.current.setId("a"));
    expect(push).toHaveBeenCalledTimes(1);
    expect(window.location.search).toBe("?p=a");
    act(() => result.current.setId("b"));
    expect(push).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledTimes(1);
    expect(window.location.search).toBe("?p=b");
    push.mockRestore();
    replace.mockRestore();
  });

  it("closes the panel when the user goes back", async () => {
    const { result } = renderHook(usePanelPage);
    act(() => result.current.setId("a"));
    await act(async () => {
      window.history.back();
      await popped();
    });
    expect(result.current.id).toBeNull();
    expect(window.location.search).toBe("");
  });

  it("goes back (instead of leaving a stale entry) when closed from the panel", async () => {
    const back = vi.spyOn(window.history, "back");
    const { result } = renderHook(usePanelPage);
    act(() => result.current.setId("a"));
    const apply = vi.fn(() => result.current.setId(null));
    await act(async () => {
      result.current.close(apply);
      await popped();
    });
    expect(back).toHaveBeenCalledTimes(1);
    expect(apply).toHaveBeenCalledTimes(1);
    expect(result.current.id).toBeNull();
    expect(window.location.search).toBe("");
    back.mockRestore();
  });

  it("does not go back when the panel came from a deep link (that would leave the site)", () => {
    window.history.replaceState(null, "", "/?p=a");
    const back = vi.spyOn(window.history, "back");
    const { result } = renderHook(usePanelPage);
    expect(result.current.id).toBe("a");
    act(() => result.current.close(() => result.current.setId(null)));
    expect(back).not.toHaveBeenCalled();
    expect(result.current.id).toBeNull();
    expect(window.location.search).toBe("");
    back.mockRestore();
  });

  it("reopens the panel when the user goes forward again", async () => {
    const { result } = renderHook(usePanelPage);
    act(() => result.current.setId("a"));
    await act(async () => {
      window.history.back();
      await popped();
    });
    expect(result.current.id).toBeNull();
    await act(async () => {
      window.history.forward();
      await popped();
    });
    expect(result.current.id).toBe("a");
  });
});
