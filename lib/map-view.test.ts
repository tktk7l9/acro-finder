import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  JAPAN_BOUNDS,
  MAX_ZOOM,
  MIN_ZOOM,
  PLACEHOLDER,
  clusterRadius,
  fitZoom,
  placeholderGeometry,
  projectPx,
  zoomThreshold,
} from "./map-view";

describe("projectPx", () => {
  it("maps the origin and the antimeridian like Leaflet's EPSG:3857", () => {
    expect(projectPx(0, 0, 0)).toEqual({ x: 128, y: 128 });
    const p = projectPx(0, 180, 1);
    expect(p.x).toBe(512);
    expect(p.y).toBeCloseTo(256);
  });

  it("puts Tokyo in GSI z4 tile x=14, y=6", () => {
    const p = projectPx(35.681, 139.767, 4);
    expect(Math.floor(p.x / 256)).toBe(14);
    expect(Math.floor(p.y / 256)).toBe(6);
  });
});

describe("fitZoom", () => {
  it("opens a phone-sized map at zoom 4", () => {
    expect(fitZoom(390, 330)).toBe(4);
  });

  it("opens a typical desktop map at zoom 5", () => {
    expect(fitZoom(1020, 800)).toBe(5);
  });

  it("clamps to the map's zoom range", () => {
    expect(fitZoom(100, 100)).toBe(MIN_ZOOM);
    expect(fitZoom(0, 0)).toBe(MIN_ZOOM);
    expect(fitZoom(1e9, 1e9)).toBe(MAX_ZOOM);
  });

  it("switches zoom exactly at the published thresholds", () => {
    const t = zoomThreshold(5);
    expect(fitZoom(t.width, t.height)).toBe(5);
    expect(fitZoom(t.width - 1, t.height)).toBe(4);
    expect(fitZoom(t.width, t.height - 1)).toBe(4);
  });
});

describe("placeholderGeometry", () => {
  it("covers the whole Japan bounds with room around it", () => {
    const g = placeholderGeometry();
    const [[south, west], [north, east]] = JAPAN_BOUNDS;
    const origin = { x: PLACEHOLDER.tileX[0] * 256, y: PLACEHOLDER.tileY[0] * 256 };
    const sw = projectPx(south, west, PLACEHOLDER.zoom);
    const ne = projectPx(north, east, PLACEHOLDER.zoom);
    expect(g.width).toBe(1024);
    expect(g.height).toBe(768);
    expect(sw.x - origin.x).toBeGreaterThan(0);
    expect(ne.x - origin.x).toBeLessThan(g.width);
    expect(ne.y - origin.y).toBeGreaterThan(0);
    expect(sw.y - origin.y).toBeLessThan(g.height);
    expect(g.centerX).toBeCloseTo((sw.x + ne.x) / 2 - origin.x);
    expect(g.centerY).toBeCloseTo((sw.y + ne.y) / 2 - origin.y);
  });
});

describe("globals.css placeholder breakpoints", () => {
  // The CSS cannot import these numbers, so check it uses the same ones.
  const css = readFileSync(join(import.meta.dirname, "../app/globals.css"), "utf8");
  for (const zoom of [5, 6, 7]) {
    it(`scales the placeholder for zoom ${zoom} at the Leaflet threshold`, () => {
      const t = zoomThreshold(zoom);
      expect(css).toContain(
        `@container map-placeholder (min-width: ${t.width}px) and (min-height: ${t.height}px)`,
      );
    });
  }
});

describe("clusterRadius", () => {
  it("merges neighbours more eagerly at the country-wide zooms", () => {
    expect(clusterRadius(4)).toBe(80);
    expect(clusterRadius(6)).toBe(80);
  });

  it("keeps the tighter radius from zoom 7 in", () => {
    expect(clusterRadius(7)).toBe(52);
    expect(clusterRadius(12)).toBe(52);
  });
});
