import { useSyncExternalStore } from "react";

// A page-wide "the first view is done" flag: it turns true once the window
// `load` event has fired and the browser is next idle.
//
// The facility list hotlinks each facility's official image, some of them
// 500 KB originals that this deployment cannot resize. Rendered in the server
// HTML they started downloading alongside the map placeholder, CSS and JS and
// pushed the first view back on a slow phone. Cards wait for this flag
// instead and show their striped placeholder (same box size) until then.

let ready = false;
let started = false;
const listeners = new Set<() => void>();

function onIdle(cb: () => void): void {
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(() => cb(), { timeout: 2000 });
  } else {
    setTimeout(cb, 0);
  }
}

function markReady(): void {
  ready = true;
  for (const l of listeners) l();
}

function start(): void {
  if (started) return;
  started = true;
  const fire = () => onIdle(markReady);
  if (document.readyState === "complete") fire();
  else window.addEventListener("load", fire, { once: true });
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  start();
  return () => listeners.delete(cb);
}

/** True after the page has loaded and gone idle; always false on the server. */
export function useAfterLoad(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => ready,
    () => false,
  );
}

/** Test hook: reset the module state. */
export function __resetAfterLoad(): void {
  ready = false;
  started = false;
  listeners.clear();
}
