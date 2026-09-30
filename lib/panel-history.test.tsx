import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { StrictMode, useEffect, useState } from "react";
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

// Like the real pages: the URL is applied in a mount effect (after the first
// render), not in the state initializer.
function useHydratedPanelPage() {
  const [id, setId] = useState<string | null>(null);
  const restore = (sp: URLSearchParams) => {
    const next = sp.get("p");
    setId(next);
    return next !== null;
  };
  useEffect(() => {
    // Deliberately the same mount-time setState the pages do.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    restore(new URLSearchParams(window.location.search));
  }, []);
  const close = usePanelHistory({ panelOpen: id !== null, search: id ? `?p=${id}` : "", restore });
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

  // React StrictMode (on in dev) runs mount effects twice; the second run must
  // not treat the still-default state as a change and wipe a deep link.
  it("leaves a deep link alone when StrictMode re-runs the mount effects", () => {
    window.history.replaceState(null, "", "/?p=a");
    const push = vi.spyOn(window.history, "pushState");
    const replace = vi.spyOn(window.history, "replaceState");
    const back = vi.spyOn(window.history, "back");
    const { result } = renderHook(useHydratedPanelPage, { wrapper: StrictMode });
    expect(result.current.id).toBe("a");
    expect(push).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
    expect(window.location.search).toBe("?p=a");
    // Still a deep link: closing applies directly, never navigates away.
    act(() => result.current.close(() => result.current.setId(null)));
    expect(back).not.toHaveBeenCalled();
    expect(result.current.id).toBeNull();
    push.mockRestore();
    replace.mockRestore();
    back.mockRestore();
  });

  // A hand-typed deep link may order or encode the parameters differently
  // from what the page writes; that is the same state, not a new entry.
  it("treats a differently ordered query string as the same state", () => {
    window.history.replaceState(null, "", "/?x=%E3%81%82&p=a");
    const push = vi.spyOn(window.history, "pushState");
    const { rerender } = renderHook(
      (props: { open: boolean; search: string }) =>
        usePanelHistory({ panelOpen: props.open, search: props.search, restore: () => true }),
      { initialProps: { open: false, search: "" } },
    );
    // Mount-time hydration lands: the state now matches the URL.
    rerender({ open: true, search: "?p=a&x=あ" });
    expect(push).not.toHaveBeenCalled();
    expect(window.location.search).toBe("?x=%E3%81%82&p=a");
    push.mockRestore();
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
