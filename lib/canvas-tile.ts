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

export type TileDone = (error: Error | undefined, tile: HTMLCanvasElement) => void;

export function loadTileIntoCanvas(
  canvas: HTMLCanvasElement,
  url: string,
  done: TileDone,
  createImage: () => HTMLImageElement = () => new Image(),
): void {
  const img = createImage();
  img.decoding = "async";
  img.onload = () => {
    img.onload = img.onerror = null;
    canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
    done(undefined, canvas);
  };
  img.onerror = () => {
    img.onload = img.onerror = null;
    done(new Error(`Tile failed to load: ${url}`), canvas);
  };
  img.src = url;
}
