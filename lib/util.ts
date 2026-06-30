export function formatDistance(km: number): string {
  return km < 100 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
}

// Numeric value of a price string, used for sorting. Only the FIRST amount is
// taken — strings like "月額 ¥9,800〜 / 入会金 ¥3,000" must not have their
// digits concatenated into one huge number. Missing/unparseable prices sort last.
export function priceValue(price?: string): number {
  if (!price) return Number.MAX_SAFE_INTEGER;
  const match = price.match(/\d[\d,]*/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  return parseInt(match[0].replace(/,/g, ""), 10);
}

// Normalize text for search: lowercase, and fold hiragana into katakana so a
// query typed in either kana matches data written in the other (e.g. the
// query "とらんぽりん" matches the tag "トランポリン").
export function normalizeForSearch(s: string): string {
  return s
    .toLowerCase()
    .replace(/[ぁ-ゖ]/g, (c) =>
      String.fromCharCode(c.charCodeAt(0) + 0x60),
    );
}

export function todayLabel(): string {
  return ["日", "月", "火", "水", "木", "金", "土"][new Date().getDay()];
}

// Current date in JST as YYYY-MM-DD. Derived from the absolute timestamp so the
// value is identical on server and client (avoids SSR/CSR hydration mismatches).
export function todayJst(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

// Add `days` to a YYYY-MM-DD string, returning YYYY-MM-DD (timezone-stable).
export function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

interface LatLng {
  lat: number;
  lng: number;
}

const MONTH_SHORT = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const MONTH_EN = [
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
];
const DOW = ["日", "月", "火", "水", "木", "金", "土"];

// Parse a "YYYY-MM-DD" string in a timezone-stable way (avoids SSR/client
// hydration mismatches from Date locale parsing).
export function fmtEventDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const dayIdx = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return {
    year: y,
    monthNum: m,
    day: d,
    monthShort: MONTH_SHORT[m - 1],
    monthEn: MONTH_EN[m - 1],
    monthKey: `${y}-${String(m).padStart(2, "0")}`,
    monthLabel: `${y}年 ${m}月`,
    dayName: DOW[dayIdx],
    dayIdx,
  };
}

// Great-circle distance in kilometers (haversine).
export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
