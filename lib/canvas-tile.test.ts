import { describe, it, expect, vi } from "vitest";
import { EMPTY_IMAGE_URL, loadTileIntoCanvas } from "./canvas-tile";

type FakeImage = {
  onload: (() => void) | null;
  onerror: (() => void) | null;
  decoding: string;
  src: string;
};

function fakeImage(): FakeImage {
  return { onload: null, onerror: null, decoding: "", src: "" };
}

const asImage = (img: FakeImage) => () => img as unknown as HTMLImageElement;

function fakeCanvas(ctx: { drawImage: ReturnType<typeof vi.fn> } | null) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  vi.spyOn(canvas, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
  return canvas;
}

describe("loadTileIntoCanvas", () => {
  it("starts loading the tile URL asynchronously", () => {
    const img = fakeImage();
    loadTileIntoCanvas(fakeCanvas(null), "https://t.test/4/14/6.png", vi.fn(), asImage(img));
    expect(img.src).toBe("https://t.test/4/14/6.png");
    expect(img.decoding).toBe("async");
  });

  it("draws the loaded image over the whole canvas and reports success", () => {
    const img = fakeImage();
    const ctx = { drawImage: vi.fn() };
    const canvas = fakeCanvas(ctx);
    const done = vi.fn();
    loadTileIntoCanvas(canvas, "https://t.test/a.png", done, asImage(img));
    img.onload?.();
    expect(ctx.drawImage).toHaveBeenCalledWith(img, 0, 0, 256, 256);
    expect(done).toHaveBeenCalledWith(undefined, canvas);
    expect(img.onload).toBeNull();
  });

  it("still reports the tile as ready when no 2D context is available", () => {
    const img = fakeImage();
    const canvas = fakeCanvas(null);
    const done = vi.fn();
    loadTileIntoCanvas(canvas, "https://t.test/a.png", done, asImage(img));
    img.onload?.();
    expect(done).toHaveBeenCalledWith(undefined, canvas);
  });

  it("reports an error when the tile fails to load", () => {
    const img = fakeImage();
    const canvas = fakeCanvas(null);
    const done = vi.fn();
    loadTileIntoCanvas(canvas, "https://t.test/missing.png", done, asImage(img));
    img.onerror?.();
    expect(done).toHaveBeenCalledTimes(1);
    expect(done.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(done.mock.calls[0][1]).toBe(canvas);
    expect(img.onerror).toBeNull();
  });

  it("uses a real Image by default", () => {
    const canvas = fakeCanvas(null);
    expect(() => loadTileIntoCanvas(canvas, "https://t.test/a.png", vi.fn())).not.toThrow();
  });

  it("cancels a tile that is still loading when aborted", () => {
    const img = fakeImage();
    const done = vi.fn();
    const abort = loadTileIntoCanvas(fakeCanvas(null), "https://t.test/a.png", done, asImage(img));
    abort();
    expect(img.src).toBe(EMPTY_IMAGE_URL);
    expect(img.onload).toBeNull();
    expect(img.onerror).toBeNull();
    expect(done).not.toHaveBeenCalled();
  });

  it("leaves a finished tile alone when aborted afterwards", () => {
    const img = fakeImage();
    const ctx = { drawImage: vi.fn() };
    const done = vi.fn();
    const abort = loadTileIntoCanvas(fakeCanvas(ctx), "https://t.test/a.png", done, asImage(img));
    img.onload?.();
    abort();
    expect(img.src).toBe("https://t.test/a.png");
    expect(done).toHaveBeenCalledTimes(1);
  });

  it("ignores a second abort", () => {
    const img = fakeImage();
    const abort = loadTileIntoCanvas(fakeCanvas(null), "https://t.test/a.png", vi.fn(), asImage(img));
    abort();
    img.src = "untouched";
    abort();
    expect(img.src).toBe("untouched");
  });
});
