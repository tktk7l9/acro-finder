// Favourite facilities, kept per browser in localStorage. The key predates this
// module (it used to live in DetailPanel), so existing favourites carry over.
export const FAV_KEY = "acro-finder:favorites";

function defaultStorage(): Storage | undefined {
  return typeof window === "undefined" ? undefined : window.localStorage;
}

export function loadFavorites(storage: Storage | undefined = defaultStorage()): string[] {
  try {
    const raw = storage?.getItem(FAV_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    // Blocked storage (private mode) or corrupt JSON: start empty.
    return [];
  }
}

export function saveFavorites(ids: string[], storage: Storage | undefined = defaultStorage()): void {
  try {
    storage?.setItem(FAV_KEY, JSON.stringify(ids));
  } catch {
    // Storage unavailable: favourites just do not persist this session.
  }
}

export function toggleFavorite(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
}
