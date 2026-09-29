// Draws one map tile into a <canvas> instead of showing it as an <img>.
//
// With <img> tiles, a 256x256 basemap tile from cyberjapandata.gsi.go.jp became
// the page's Largest Contentful Paint: the map is client-only, so the tile
// request starts only after the JS chunk loads and LCP landed at 12-13s on a
// throttled mobile run. Lighthouse also flagged every tile under
// `image-size-responsive` (a 256px image shown at 256 CSS px on a DPR 1.75
// screen). Canvas elements are not LCP candidates or responsive-image targets,
// so drawing the same pixels into a canvas keeps the map exactly as it looks
// while the first text and list content stay the LCP.
//
// The image is loaded without `crossOrigin`: GSI tiles are only drawn, never
// read back, so a tainted canvas is fine and no CORS response is required.
//
// Returns an abort function. L.TileLayer cancels the download of a tile that
// leaves the view before it arrives (by swapping its src for an empty image);
// the canvas layer has to do the same through this, or panning and zooming on a
// phone keeps fetching tiles nobody will see.

// Same 1x1 GIF as L.Util.emptyImageUrl.
export const EMPTY_IMAGE_URL = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";

export type TileDone = (error: Error | undefined, tile: HTMLCanvasElement) => void;

export function loadTileIntoCanvas(
  canvas: HTMLCanvasElement,
  url: string,
  done: TileDone,
  createImage: () => HTMLImageElement = () => new Image(),
): () => void {
  const img = createImage();
  let settled = false;
  img.decoding = "async";
  img.onload = () => {
    settled = true;
    img.onload = img.onerror = null;
    canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
    done(undefined, canvas);
  };
  img.onerror = () => {
    settled = true;
    img.onload = img.onerror = null;
    done(new Error(`Tile failed to load: ${url}`), canvas);
  };
  img.src = url;
  // Cancel the request if it is still in flight. `done` is not called: the
  // caller has already dropped the tile.
  return () => {
    if (settled) return;
    settled = true;
    img.onload = img.onerror = null;
    img.src = EMPTY_IMAGE_URL;
  };
}
