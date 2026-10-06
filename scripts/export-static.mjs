// Copies what Next.js prerendered into public/, so OpenNext ships it as Workers static
// assets. Static assets are served without running the Worker. Rendering every page on the
// Worker exceeded the free plan's per-request CPU limit (error 1102, "Worker exceeded
// resource limits") after a few Lighthouse runs in a row.
//
//   npm run build  →  prebuild: --clean  →  next build  →  this script
//
// OpenNext runs `npm run build` and then copies public/ into .open-next/assets.
// Everything written here is listed in .gitignore and removed again by --clean, because
// Next.js refuses to build (and `next dev` refuses to serve) when a public file shadows a
// route.
//
// Workers assets use the default html_handling (auto-trailing-slash): "facilities.html"
// answers /facilities and "facilities/f01.html" answers /facilities/f01, matching Next's
// trailing-slash-less URLs. Query strings are ignored, so "/?f=f01" gets index.html.
//
// /owners is not copied: its contact form posts a Server Action to /owners, which only the
// Worker can answer.
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
// Node 24 strips types when importing a .ts module, so the header list stays in one place.
import {
  contentSecurityPolicy,
  headerRuleProblems,
  headersFile,
  inlineScriptHashes,
  staticHeaderRules,
  withCspMeta,
} from "../lib/csp.ts";

const root = join(import.meta.dirname, "..");
const app = join(root, ".next/server/app");
const pub = join(root, "public");

const GENERATED = [
  "_headers",
  "index.html",
  "events.html",
  "skills.html",
  "facilities.html",
  "facilities",
  "area",
  "icon.svg",
  "apple-icon",
  "favicon.ico",
  "opengraph-image",
  "twitter-image",
  "manifest.webmanifest",
  "sitemap.xml",
  "robots.txt",
];

for (const entry of GENERATED) rmSync(join(pub, entry), { recursive: true, force: true });
if (process.argv.includes("--clean")) process.exit(0);

function source(from) {
  const src = join(app, from);
  if (!existsSync(src)) throw new Error(`export-static: missing build output ${from}`);
  return src;
}

function copy(from, to) {
  mkdirSync(dirname(join(pub, to)), { recursive: true });
  cpSync(source(from), join(pub, to));
}

function listHtml(dir) {
  const names = readdirSync(source(dir)).filter((name) => name.endsWith(".html"));
  if (names.length === 0) throw new Error(`export-static: no prerendered pages in ${dir}/`);
  return names;
}

const csp = (value) => ({ key: "Content-Security-Policy", value });

// Pages whose header rule lists exactly the inline scripts they ship (Next's bootstrap and
// RSC payload), by sha256. Static assets never run the Worker, so a nonce is not an option.
const pageRules = [];
function copyPage(from, to, path) {
  copy(from, to);
  const hashes = inlineScriptHashes(readFileSync(join(pub, to), "utf8"));
  pageRules.push({ path, headers: [csp(contentSecurityPolicy({ scriptHashes: hashes }))] });
}

copyPage("index.html", "index.html", "/");
copyPage("events.html", "events.html", "/events");
copyPage("skills.html", "skills.html", "/skills");
copyPage("facilities.html", "facilities.html", "/facilities");
const areas = listHtml("area");
for (const name of areas) copyPage(`area/${name}`, `area/${name}`, `/area/${name.replace(/\.html$/, "")}`);

// The facility pages do not fit the _headers limits: one rule each would exceed 100 rules,
// and one shared rule listing every page's hash would exceed 2,000 characters a line. Each
// page carries its hashed policy in a <meta> tag instead, and the shared header rule keeps
// 'unsafe-inline' (plus frame-ancestors, which a <meta> policy cannot set). A browser
// enforces both policies, so only the hashed scripts run.
const facilities = listHtml("facilities");
for (const name of facilities) {
  const to = `facilities/${name}`;
  copy(to, to);
  const file = join(pub, to);
  const html = readFileSync(file, "utf8");
  const policy = contentSecurityPolicy({ scriptHashes: inlineScriptHashes(html), meta: true });
  writeFileSync(file, withCspMeta(html, policy));
}
pageRules.push({ path: "/facilities/:id", headers: [csp(contentSecurityPolicy())] });

// Route handlers and metadata files.
copy("icon.svg.body", "icon.svg");
copy("apple-icon.body", "apple-icon");
copy("opengraph-image.body", "opengraph-image");
copy("twitter-image.body", "twitter-image");
copy("manifest.webmanifest.body", "manifest.webmanifest");
copy("sitemap.xml.body", "sitemap.xml");
copy("robots.txt.body", "robots.txt");

// /favicon.ico: browsers and crawlers ask for it whatever <link rel="icon"> says. An ICO
// file may hold a PNG image as is, so the 180px apple-icon is wrapped in a one-entry ICO
// directory (width/height 180, 32 bpp, PNG data right after the 22-byte header).
const png = readFileSync(source("apple-icon.body"));
const ico = Buffer.alloc(22);
ico.writeUInt16LE(0, 0); // reserved
ico.writeUInt16LE(1, 2); // type: icon
ico.writeUInt16LE(1, 4); // one image
ico.writeUInt8(png.readUInt32BE(16), 6); // width from the PNG IHDR
ico.writeUInt8(png.readUInt32BE(20), 7); // height
ico.writeUInt16LE(1, 10); // colour planes
ico.writeUInt16LE(32, 12); // bits per pixel
ico.writeUInt32LE(png.length, 14);
ico.writeUInt32LE(22, 18); // offset of the image data
writeFileSync(join(pub, "favicon.ico"), Buffer.concat([ico, png]));

const rules = staticHeaderRules(pageRules);
const problems = headerRuleProblems(rules);
if (problems.length > 0) throw new Error(`export-static: bad _headers:\n${problems.join("\n")}`);
const body = headersFile(rules);
writeFileSync(join(pub, "_headers"), body);
console.log(
  `export-static: 4 pages, ${areas.length} area pages, ${facilities.length} facility pages, ` +
    `icons, OG images, manifest, sitemap.xml, robots.txt, favicon.ico, _headers (${rules.length} rules)`,
);
