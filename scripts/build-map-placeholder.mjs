// Builds public/map-placeholder.webp: GSI "pale" z4 tiles x 12..15, y 5..7
// stitched into one 1024x768 image (keep in sync with PLACEHOLDER in
// lib/map-view.ts). The dark look comes from the same .gsi-dark CSS filter the
// live tiles use, so the image keeps the original light colors.
//
// Source: 地理院タイル (GSI tiles), https://maps.gsi.go.jp/development/ichiran.html
// — the page shows the attribution next to the image.
//
// Run manually when the tile range changes: `node scripts/build-map-placeholder.mjs`.
// sharp is not a direct dependency; it comes with next.
import sharp from "sharp";
import { fileURLToPath } from "node:url";

const ZOOM = 4;
const X = [12, 15];
const Y = [5, 7];
const out = fileURLToPath(new URL("../public/map-placeholder.webp", import.meta.url));

const tiles = [];
for (let y = Y[0]; y <= Y[1]; y++) {
  for (let x = X[0]; x <= X[1]; x++) {
    const url = `https://cyberjapandata.gsi.go.jp/xyz/pale/${ZOOM}/${x}/${y}.png`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    tiles.push({
      input: Buffer.from(await res.arrayBuffer()),
      left: (x - X[0]) * 256,
      top: (y - Y[0]) * 256,
    });
  }
}

await sharp({
  create: {
    width: (X[1] - X[0] + 1) * 256,
    height: (Y[1] - Y[0] + 1) * 256,
    channels: 3,
    background: "#ffffff",
  },
})
  .composite(tiles)
  .webp({ quality: 70, effort: 6 })
  .toFile(out);

console.log(`wrote ${out}`);
