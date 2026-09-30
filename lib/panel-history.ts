"use client";

import { useCallback, useEffect, useRef } from "react";

interface Options {
  /** Whether the panel is open in React state. */
  panelOpen: boolean;
  /** The `location.search` that represents the current state ("" or "?a=b"). */
  search: string;
  /**
   * Apply the URL's state to React state (called on popstate). Returns whether
   * the panel is open afterwards.
   */
  restore: (params: URLSearchParams) => boolean;
}

// Same parameters regardless of order or percent-encoding, so a hand-typed
// `?f=a&q=b` is not "different" from the `?q=b&f=a` the page would write.
function sameSearch(a: string, b: string): boolean {
  const pa = new URLSearchParams(a);
  const pb = new URLSearchParams(b);
  pa.sort();
  pb.sort();
  return pa.toString() === pb.toString();
}

/**
 * Mirrors a panel's open state into the URL and the browser history.
 *
 * Opening the panel pushes a history entry; changing what it shows, or typing
 * in a search box, replaces it. On phones the panel covers the whole screen,
 * so the back button (or swipe) must close it rather than leave the site
 * (SHIG 60, 82, 81). A panel opened from a deep link has no entry of its own,
 * so closing it never navigates away.
 *
 * `history` is used directly (not next/navigation) so the page stays
 * renderable without a router context, which keeps it unit-testable.
 */
export function usePanelHistory({ panelOpen, search, restore }: Options) {
  const pushed = useRef(false);
  // State as of the previous effect run; null until the first run.
  const last = useRef<{ open: boolean; search: string } | null>(null);
  const pendingClose = useRef<(() => void) | null>(null);
  const restoreRef = useRef(restore);
  useEffect(() => {
    restoreRef.current = restore;
  });

  useEffect(() => {
    const prev = last.current;
    last.current = { open: panelOpen, search };
    // The first run happens before mount-time hydration from the URL has
    // landed, so it must not clobber the URL with the still-default state.
    // StrictMode re-runs the effect with nothing changed; skip that too.
    if (!prev || (prev.open === panelOpen && prev.search === search)) return;
    const opening = panelOpen && !prev.open;
    if (sameSearch(window.location.search, search)) return;
    const url = search || window.location.pathname;
    if (opening) {
      window.history.pushState(null, "", url);
      pushed.current = true;
    } else {
      window.history.replaceState(null, "", url);
    }
  }, [panelOpen, search]);

  useEffect(() => {
    const onPop = () => {
      const params = new URLSearchParams(window.location.search);
      const finish = pendingClose.current;
      pendingClose.current = null;
      pushed.current = restoreRef.current(params);
      finish?.();
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  /**
   * Close the panel. When this hook pushed an entry for it, go back so the
   * history stays clean; otherwise apply the close directly. `apply` runs in
   * both cases once the panel is closed.
   */
  const close = useCallback((apply: () => void) => {
    if (pushed.current) {
      pushed.current = false;
      pendingClose.current = apply;
      window.history.back();
    } else {
      apply();
    }
  }, []);

  return close;
}
