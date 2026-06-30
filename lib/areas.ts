import { FACILITIES } from "./data";
import { PREFECTURES, type Prefecture } from "./prefectures";
import type { Facility } from "./types";

// Romaji slug for every prefecture, used for clean `/area/<slug>` URLs.
export const PREFECTURE_SLUGS: Record<string, string> = {
  北海道: "hokkaido",
  青森県: "aomori",
  岩手県: "iwate",
  宮城県: "miyagi",
  秋田県: "akita",
  山形県: "yamagata",
  福島県: "fukushima",
  茨城県: "ibaraki",
  栃木県: "tochigi",
  群馬県: "gunma",
  埼玉県: "saitama",
  千葉県: "chiba",
  東京都: "tokyo",
  神奈川県: "kanagawa",
  新潟県: "niigata",
  富山県: "toyama",
  石川県: "ishikawa",
  福井県: "fukui",
  山梨県: "yamanashi",
  長野県: "nagano",
  岐阜県: "gifu",
  静岡県: "shizuoka",
  愛知県: "aichi",
  三重県: "mie",
  滋賀県: "shiga",
  京都府: "kyoto",
  大阪府: "osaka",
  兵庫県: "hyogo",
  奈良県: "nara",
  和歌山県: "wakayama",
  鳥取県: "tottori",
  島根県: "shimane",
  岡山県: "okayama",
  広島県: "hiroshima",
  山口県: "yamaguchi",
  徳島県: "tokushima",
  香川県: "kagawa",
  愛媛県: "ehime",
  高知県: "kochi",
  福岡県: "fukuoka",
  佐賀県: "saga",
  長崎県: "nagasaki",
  熊本県: "kumamoto",
  大分県: "oita",
  宮崎県: "miyazaki",
  鹿児島県: "kagoshima",
  沖縄県: "okinawa",
};

// A prefecture together with the facilities located in it.
export interface AreaGroup {
  prefecture: Prefecture;
  slug: string;
  facilities: Facility[];
}

// The prefecture a facility sits in, derived from the head of its address
// (every facility address begins with a formal prefecture name).
export function prefectureOf(facility: Facility): Prefecture | undefined {
  return PREFECTURES.find((p) => facility.address.startsWith(p.name));
}

export function slugForPrefecture(name: string): string | undefined {
  return PREFECTURE_SLUGS[name];
}

export function prefectureBySlug(slug: string): Prefecture | undefined {
  const name = Object.keys(PREFECTURE_SLUGS).find((n) => PREFECTURE_SLUGS[n] === slug);
  return name ? PREFECTURES.find((p) => p.name === name) : undefined;
}

// Facilities in a prefecture, nearest-first by the data's distance baseline.
export function facilitiesInPrefecture(name: string): Facility[] {
  return FACILITIES.filter((f) => prefectureOf(f)?.name === name).sort(
    (a, b) => a.distance - b.distance,
  );
}

export interface PrefectureSummary {
  total: number;
  byType: Record<Facility["type"], number>;
  cities: string[];
}

// Real, data-derived summary of a prefecture's facilities — used to give each
// area page unique (non-templated) copy instead of duplicate boilerplate.
export function prefectureSummary(name: string): PrefectureSummary {
  const list = facilitiesInPrefecture(name);
  const byType: Record<Facility["type"], number> = { parkour: 0, tricking: 0, mixed: 0 };
  const cities: string[] = [];
  for (const f of list) {
    byType[f.type] += 1;
    const city = f.area.split("/").pop()?.trim();
    if (city && !cities.includes(city)) cities.push(city);
  }
  return { total: list.length, byType, cities };
}

// Other facilities in the same prefecture as `facility` (nearest-first),
// for cross-linking a facility page to its neighbours.
export function sameAreaFacilities(facility: Facility, limit = 6): Facility[] {
  const pref = prefectureOf(facility);
  if (!pref) return [];
  return facilitiesInPrefecture(pref.name)
    .filter((f) => f.id !== facility.id)
    .slice(0, limit);
}

// All prefectures that have at least one facility, ordered by facility count
// (desc) then by the canonical north-to-south prefecture order.
export function facilitiesByPrefecture(): AreaGroup[] {
  const order = new Map(PREFECTURES.map((p, i) => [p.name, i]));
  const groups = new Map<string, Facility[]>();
  for (const f of FACILITIES) {
    const pref = prefectureOf(f);
    if (!pref) continue;
    const list = groups.get(pref.name) ?? [];
    list.push(f);
    groups.set(pref.name, list);
  }
  return [...groups.entries()]
    .map(([name, facilities]) => {
      const prefecture = PREFECTURES.find((p) => p.name === name)!;
      return {
        prefecture,
        slug: PREFECTURE_SLUGS[name],
        facilities: facilities.sort((a, b) => a.distance - b.distance),
      };
    })
    .sort(
      (a, b) =>
        b.facilities.length - a.facilities.length ||
        (order.get(a.prefecture.name) ?? 0) - (order.get(b.prefecture.name) ?? 0),
    );
}
