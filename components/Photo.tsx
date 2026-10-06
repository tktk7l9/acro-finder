"use client";

import { useState } from "react";
import type { Photo as PhotoData } from "@/lib/types";
import { imageCrossOrigin } from "@/lib/image-cors";
import { useAfterLoad } from "@/lib/after-load";

export function Star() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12">
      <path d="M6 0.5l1.7 3.5 3.8 0.5-2.7 2.7 0.7 3.8L6 9.2l-3.4 1.8 0.7-3.8L0.5 4.5l3.8-0.5z" />
    </svg>
  );
}

// A geometric glyph per facility type, shown as a watermark on the placeholder
// so a photo-less facility still reads as intentional (and hints its discipline).
const TYPE_GLYPH: Record<string, string> = {
  parkour: "◰",
  tricking: "✦",
  mixed: "◈",
};

// When `src` (a hotlinked official image) is given it is shown; if it fails to
// load the striped placeholder is shown instead. `type` adds a discipline glyph
// to the placeholder. `defer` keeps the placeholder until the page has loaded
// (see lib/after-load.ts), for thumbnails that are not the point of the first view.
export function Photo({
  data,
  src,
  type,
  className,
  defer = false,
}: {
  data: PhotoData;
  src?: string;
  type?: string;
  className?: string;
  defer?: boolean;
}) {
  const [errored, setErrored] = useState(false);
  const loaded = useAfterLoad();
  const showImage = src && !errored && (!defer || loaded);
  return (
    <div className={`photo ${data.color} ${className ?? ""}`}>
      {showImage ? (
        <img
          className="photo-img"
          src={src}
          alt={data.label}
          loading="lazy"
          decoding="async"
          crossOrigin={imageCrossOrigin(src)}
          onError={() => setErrored(true)}
        />
      ) : (
        <>
          {type && (
            <span className="photo-glyph" aria-hidden>
              {TYPE_GLYPH[type] ?? "◆"}
            </span>
          )}
          {/* With a glyph the placeholder is decorative; its "〇〇 — 写真準備中"
              caption would only repeat the name printed beside it (SHIG 1). */}
          {!type && <div className="photo-label">{data.label}</div>}
        </>
      )}
    </div>
  );
}
