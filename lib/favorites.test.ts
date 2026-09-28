import { describe, it, expect, beforeEach } from "vitest";
import { FAV_KEY, loadFavorites, saveFavorites, toggleFavorite } from "./favorites";

describe("favorites", () => {
  beforeEach(() => localStorage.clear());

  it("loads an empty list when nothing is stored", () => {
    expect(loadFavorites()).toEqual([]);
  });

  it("round-trips through localStorage under the existing key", () => {
    saveFavorites(["f01", "f02"]);
    expect(localStorage.getItem(FAV_KEY)).toBe('["f01","f02"]');
    expect(loadFavorites()).toEqual(["f01", "f02"]);
  });

  it("ignores corrupt or non-array data", () => {
    localStorage.setItem(FAV_KEY, "{not json");
    expect(loadFavorites()).toEqual([]);
    localStorage.setItem(FAV_KEY, '{"a":1}');
    expect(loadFavorites()).toEqual([]);
    localStorage.setItem(FAV_KEY, '["f01", 3]');
    expect(loadFavorites()).toEqual(["f01"]);
  });

  it("survives a storage that throws", () => {
    const broken = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    } as unknown as Storage;
    expect(loadFavorites(broken)).toEqual([]);
    expect(() => saveFavorites(["f01"], broken)).not.toThrow();
  });

  it("toggles an id in and out", () => {
    expect(toggleFavorite([], "f01")).toEqual(["f01"]);
    expect(toggleFavorite(["f01", "f02"], "f01")).toEqual(["f02"]);
  });
});
