import type { CSSProperties } from "react";
import { PLACEHOLDER, placeholderGeometry } from "@/lib/map-view";

const GEOMETRY = placeholderGeometry();

// Static picture of the basemap, in the server HTML, shown under the Leaflet
// map until its first tiles are drawn. Without it the map area stayed an empty
// box for seconds on a slow phone, and the late tile image was the page's LCP.
// Geometry and the zoom-matching container queries: lib/map-view.ts and
// .map-placeholder in globals.css.
export function MapPlaceholder({ done }: { done: boolean }) {
  const style = {
    "--ph-w": GEOMETRY.width,
    "--ph-cx": GEOMETRY.centerX.toFixed(2),
    "--ph-cy": GEOMETRY.centerY.toFixed(2),
  } as CSSProperties;
  return (
    <div className={`map-placeholder ${done ? "done" : ""}`} aria-hidden style={style}>
      {/* A plain <img>: next/image would route it through the image optimizer,
          which this Workers deployment does not run. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="gsi-dark"
        src={PLACEHOLDER.src}
        alt=""
        width={GEOMETRY.width}
        height={GEOMETRY.height}
        fetchPriority="high"
        decoding="async"
      />
      <span className="map-placeholder-credit">地理院タイル</span>
    </div>
  );
}
