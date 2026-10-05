// Geometry shared by the Leaflet map and its server-rendered placeholder.
//
// The map is client-only, so on a throttled phone its tiles arrived 12-13s after
// navigation and the first view was an empty dark box. The placeholder is a
// static image of the same GSI basemap (public/map-placeholder.webp, built by
// scripts/build-map-placeholder.mjs) that is in the HTML from the start. It is
// positioned so that it lines up pixel for pixel with the view Leaflet opens
// with — fitBounds(JAPAN_BOUNDS) at an integer zoom — so the real tiles replace
// it without a jump.

type LatLng = readonly [number, number];

// Bounding box of Japan's four main islands, used for the default view.
export const JAPAN_BOUNDS: readonly [LatLng, LatLng] = [
  [30.8, 129.0],
  [45.8, 146.2],
];

export const MIN_ZOOM = 4;
export const MAX_ZOOM = 18;
const TILE_SIZE = 256;

// Web Mercator pixel coordinates at `zoom` (Leaflet's EPSG:3857 with 256px tiles).
export function projectPx(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const scale = TILE_SIZE * 2 ** zoom;
  const rad = (lat * Math.PI) / 180;
  const y = Math.log(Math.tan(Math.PI / 4 + rad / 2));
  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - y / (2 * Math.PI)) * scale,
  };
}

function boundsSizeAtZoom0(bounds = JAPAN_BOUNDS) {
  const [[south, west], [north, east]] = bounds;
  const sw = projectPx(south, west, 0);
  const ne = projectPx(north, east, 0);
  return { width: ne.x - sw.x, height: sw.y - ne.y };
}

// Leaflet's getBoundsZoom rounds the exact zoom to 1/100 of zoomSnap before
// flooring it, so a zoom of 4.996 already counts as 5.
const SNAP_ROUNDING = 0.005;

// The zoom Leaflet picks for fitBounds(bounds) in a width x height container
// (zoomSnap 1, no padding): the largest integer zoom at which the bounds fit,
// clamped to the map's min/max zoom.
export function fitZoom(width: number, height: number, bounds = JAPAN_BOUNDS): number {
  const size = boundsSizeAtZoom0(bounds);
  const scale = Math.min(width / size.width, height / size.height);
  const zoom = scale > 0 ? Math.floor(Math.round(Math.log2(scale) * 100) / 100) : MIN_ZOOM;
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

// Smallest container size that makes Leaflet open at `zoom` or closer. The CSS
// container queries in globals.css (.map-placeholder) must use these numbers;
// a test keeps the two in sync.
export function zoomThreshold(zoom: number, bounds = JAPAN_BOUNDS): { width: number; height: number } {
  const size = boundsSizeAtZoom0(bounds);
  return {
    width: Math.ceil(size.width * 2 ** (zoom - SNAP_ROUNDING)),
    height: Math.ceil(size.height * 2 ** (zoom - SNAP_ROUNDING)),
  };
}

// The placeholder image covers GSI z4 tiles x 12..15, y 5..7 — enough to fill
// the widest desktop view around Japan.
export const PLACEHOLDER = {
  zoom: MIN_ZOOM,
  tileX: [12, 15] as const,
  tileY: [5, 7] as const,
  src: "/map-placeholder.webp",
};

export function placeholderGeometry(bounds = JAPAN_BOUNDS) {
  const { zoom, tileX, tileY } = PLACEHOLDER;
  const originX = tileX[0] * TILE_SIZE;
  const originY = tileY[0] * TILE_SIZE;
  const [[south, west], [north, east]] = bounds;
  const sw = projectPx(south, west, zoom);
  const ne = projectPx(north, east, zoom);
  return {
    width: (tileX[1] - tileX[0] + 1) * TILE_SIZE,
    height: (tileY[1] - tileY[0] + 1) * TILE_SIZE,
    // Where fitBounds centres the view, relative to the image's top-left corner.
    centerX: (sw.x + ne.x) / 2 - originX,
    centerY: (sw.y + ne.y) / 2 - originY,
  };
}

// Marker clustering radius (px) per zoom. At the country-wide zooms a single
// 36px pin could sit half on top of a neighbouring 40px cluster, leaving
// neither a reliable tap target (SHIG 13, 78; Lighthouse target-size). A wider
// radius there merges such neighbours; closer in, the tighter radius keeps
// dense city areas split up as before.
const WIDE_VIEW_MAX_ZOOM = 6;

export function clusterRadius(zoom: number): number {
  return zoom <= WIDE_VIEW_MAX_ZOOM ? 80 : 52;
}
