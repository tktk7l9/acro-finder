import { describe, it, expect } from "vitest";
import { FACILITIES, EQUIPMENT_FILTERS, TYPE_FILTERS } from "./data";
import { prefectureOf } from "./areas";
import { TOKYO_STATION, haversineKm, roundDistanceKm } from "./util";

// Prefecture bounding boxes [minLat, maxLat, minLng, maxLng] in degrees.
// Source: GSI (国土地理院) 「都道府県の東西南北端点の経度緯度」, rounded
// outward to 0.1° so the table is a sanity net, not a survey. 東京都 is the
// mainland only (the island chain reaches 20°N — no facility is there, and
// including it would let a Kanagawa point pass as Tokyo). 北海道 and 島根県
// exclude the disputed/remote islets.
const PREFECTURE_BOUNDS: Record<string, [number, number, number, number]> = {
  北海道: [41.3, 45.6, 139.3, 145.9],
  青森県: [40.2, 41.6, 139.5, 141.7],
  岩手県: [38.7, 40.5, 140.6, 142.1],
  宮城県: [37.7, 39.1, 140.2, 141.7],
  秋田県: [38.8, 40.6, 139.6, 141.0],
  山形県: [37.7, 39.3, 139.5, 140.7],
  福島県: [36.7, 38.0, 139.1, 141.1],
  茨城県: [35.7, 37.0, 139.6, 140.9],
  栃木県: [36.1, 37.2, 139.3, 140.3],
  群馬県: [35.9, 37.1, 138.3, 139.7],
  埼玉県: [35.7, 36.3, 138.7, 140.0],
  千葉県: [34.8, 36.2, 139.7, 140.9],
  東京都: [35.5, 36.0, 138.9, 140.0],
  神奈川県: [35.1, 35.7, 138.9, 139.9],
  新潟県: [36.7, 38.6, 137.6, 140.0],
  富山県: [36.2, 37.0, 136.7, 137.8],
  石川県: [36.0, 37.9, 136.2, 137.4],
  福井県: [35.3, 36.4, 135.4, 136.9],
  山梨県: [35.1, 36.0, 138.1, 139.2],
  長野県: [35.1, 37.1, 137.3, 138.8],
  岐阜県: [35.1, 36.5, 136.2, 137.7],
  静岡県: [34.5, 35.7, 137.4, 139.2],
  愛知県: [34.5, 35.5, 136.6, 137.9],
  三重県: [33.7, 35.3, 135.8, 137.0],
  滋賀県: [34.7, 35.8, 135.7, 136.5],
  京都府: [34.7, 35.8, 134.8, 136.1],
  大阪府: [34.2, 35.1, 135.0, 135.8],
  兵庫県: [34.1, 35.7, 134.2, 135.5],
  奈良県: [33.8, 34.8, 135.5, 136.3],
  和歌山県: [33.4, 34.4, 134.9, 136.1],
  鳥取県: [35.0, 35.7, 133.1, 134.6],
  島根県: [34.2, 36.5, 131.6, 133.4],
  岡山県: [34.2, 35.4, 133.2, 134.5],
  広島県: [34.0, 35.2, 132.0, 133.5],
  山口県: [33.7, 34.9, 130.7, 132.5],
  徳島県: [33.5, 34.3, 133.6, 134.9],
  香川県: [34.0, 34.6, 133.4, 134.5],
  愛媛県: [32.8, 34.4, 132.0, 133.8],
  高知県: [32.6, 33.9, 132.4, 134.4],
  福岡県: [32.9, 34.3, 129.9, 131.2],
  佐賀県: [32.9, 33.7, 129.7, 130.6],
  長崎県: [31.9, 34.8, 128.0, 130.4],
  熊本県: [32.0, 33.3, 129.9, 131.4],
  大分県: [32.7, 33.8, 130.8, 132.1],
  宮崎県: [31.3, 32.9, 130.6, 131.9],
  鹿児島県: [27.0, 32.4, 128.3, 131.3],
  沖縄県: [24.0, 27.9, 122.9, 131.4],
};

describe("FACILITIES", () => {
  it("has 116 real facilities with unique ids", () => {
    expect(FACILITIES).toHaveLength(116);
    expect(new Set(FACILITIES.map((f) => f.id)).size).toBe(116);
  });

  it("has well-formed core fields on every facility", () => {
    for (const f of FACILITIES) {
      expect(f.id).toMatch(/^f\d{2,3}$/);
      expect(f.name.length).toBeGreaterThan(0);
      expect(f.nameJa.length).toBeGreaterThan(0);
      expect(f.description.length).toBeGreaterThan(0);
      expect(["tricking", "parkour", "mixed"]).toContain(f.type);
      expect(f.lat).toBeGreaterThan(24);
      expect(f.lat).toBeLessThan(46);
      expect(f.lng).toBeGreaterThan(122);
      expect(f.lng).toBeLessThan(154);
      expect(f.distance).toBeGreaterThanOrEqual(0);
      expect(f.photos.length).toBeGreaterThan(0);
      expect(f.tags.length).toBeGreaterThan(0);
      expect(f.registeredAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(f.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("only links to http(s) URLs (they are rendered as hrefs and hotlinked images)", () => {
    // Facility data is imported from scraped sources; a javascript: or data:
    // value here would reach <a href> / <img src> unescaped by React.
    for (const f of FACILITIES) {
      if (f.links.web) expect(f.links.web).toMatch(/^https?:\/\//);
      if (f.image) expect(f.image).toMatch(/^https?:\/\//);
      for (const handle of [f.links.instagram, f.links.twitter, f.links.youtube, f.links.tiktok]) {
        if (handle) expect(handle).not.toMatch(/[\s"'<>]|^\/\/|:/);
      }
    }
  });

  it("keeps optional rich fields internally consistent when present", () => {
    for (const f of FACILITIES) {
      if (f.hours) expect(f.hours).toHaveLength(7);
      if (f.rating !== undefined) {
        expect(f.rating).toBeGreaterThan(0);
        expect(f.rating).toBeLessThanOrEqual(5);
      }
      if (f.lessons) expect(typeof f.lessons.available).toBe("boolean");
      if (f.equipment) expect(f.equipment.length).toBeGreaterThan(0);
    }
  });

  it("covers multiple prefectures", () => {
    const prefs = new Set(FACILITIES.map((f) => f.area.split(" / ")[0]));
    expect(prefs.size).toBeGreaterThanOrEqual(5);
  });

  it("gives every facility its own coordinate unless two share a building", () => {
    // Older entries reused a ward centroid, so several pins stacked on one
    // point and distances were wrong. Two facilities may share a point only
    // when their street address (the part before the building name) is the
    // same — that is the documented exception, verified by address equality.
    const street = (address: string) => address.split(/\s/)[0];
    const byCoord = new Map<string, typeof FACILITIES>();
    for (const f of FACILITIES) {
      const key = `${f.lat},${f.lng}`;
      byCoord.set(key, [...(byCoord.get(key) ?? []), f]);
    }
    for (const [key, group] of byCoord) {
      if (group.length === 1) continue;
      const streets = new Set(group.map((f) => street(f.address)));
      expect(streets.size, `${group.map((f) => f.id).join(", ")} share ${key} with different addresses`).toBe(1);
    }
  });

  it("stores distance as the rounded great-circle km from Tokyo Station", () => {
    // `distance` is shown as 「東京駅から」 before the browser shares a location
    // and orders the area pages, so it must follow the coordinates.
    for (const f of FACILITIES) {
      const km = roundDistanceKm(haversineKm(TOKYO_STATION, { lat: f.lat, lng: f.lng }));
      expect(f.distance, `${f.id} distance is stale`).toBe(km);
    }
  });

  it("places every facility inside its prefecture's bounding box", () => {
    for (const f of FACILITIES) {
      const pref = prefectureOf(f);
      expect(pref, `${f.id}: address does not start with a prefecture`).toBeDefined();
      const box = PREFECTURE_BOUNDS[pref!.name];
      expect(box, `${f.id}: no bounding box for ${pref!.name}`).toBeDefined();
      const [minLat, maxLat, minLng, maxLng] = box;
      expect(f.lat, `${f.id} lat outside ${pref!.name}`).toBeGreaterThanOrEqual(minLat);
      expect(f.lat, `${f.id} lat outside ${pref!.name}`).toBeLessThanOrEqual(maxLat);
      expect(f.lng, `${f.id} lng outside ${pref!.name}`).toBeGreaterThanOrEqual(minLng);
      expect(f.lng, `${f.id} lng outside ${pref!.name}`).toBeLessThanOrEqual(maxLng);
    }
  });
});

describe("filter constants", () => {
  it("TYPE_FILTERS starts with 'all'", () => {
    expect(TYPE_FILTERS[0].key).toBe("all");
    expect(TYPE_FILTERS.length).toBeGreaterThan(1);
  });
  it("EQUIPMENT_FILTERS each have a key and icon", () => {
    expect(EQUIPMENT_FILTERS.length).toBeGreaterThan(0);
    for (const e of EQUIPMENT_FILTERS) {
      expect(e.key.length).toBeGreaterThan(0);
      expect(e.icon.length).toBeGreaterThan(0);
    }
  });
});
