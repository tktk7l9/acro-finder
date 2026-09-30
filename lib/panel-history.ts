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
  const wasOpen = useRef(false);
  const synced = useRef(false);
  const pendingClose = useRef<(() => void) | null>(null);
  const restoreRef = useRef(restore);
  useEffect(() => {
    restoreRef.current = restore;
  });

  useEffect(() => {
    // The first run happens before mount-time hydration from the URL has
    // landed, so it must not clobber the URL with the still-default state.
    if (!synced.current) {
      synced.current = true;
      wasOpen.current = panelOpen;
      return;
    }
    const opening = panelOpen && !wasOpen.current;
    wasOpen.current = panelOpen;
    if (window.location.search === search) return;
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
