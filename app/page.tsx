"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { EQUIPMENT_FILTERS, FACILITIES, TYPE_FILTERS } from "@/lib/data";
import { EVENTS } from "@/lib/events-data";
import type { SortKey } from "@/lib/types";
import { PREFECTURES, type Prefecture } from "@/lib/prefectures";
import { haversineKm, normalizeForSearch, priceValue } from "@/lib/util";

const EVENT_COUNT = EVENTS.length;
import { FacilityCard } from "@/components/FacilityCard";
import { DetailPanel } from "@/components/DetailPanel";

// Leaflet needs `window`, so the map is client-only (no SSR).
const InteractiveMap = dynamic(
  () => import("@/components/InteractiveMap").then((m) => m.InteractiveMap),
  { ssr: false },
);

// Fallback position shown before the browser geolocation is granted —
// central Tokyo (around Tokyo Station).
const DEFAULT_POS = { lat: 35.681, lng: 139.767 };

type GeoState = "idle" | "locating" | "active" | "error";

export default function Page() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [equipFilters, setEquipFilters] = useState<string[]>([]);
  const [sort, setSort] = useState<SortKey>("distance");
  const [showUser, setShowUser] = useState(true);
  const [userPos, setUserPos] = useState(DEFAULT_POS);
  const [geoState, setGeoState] = useState<GeoState>("idle");
  const [geoMessage, setGeoMessage] = useState("");
  const [focusPref, setFocusPref] = useState<Prefecture | null>(null);

  // Keep the search box responsive: typing updates `query` immediately, while
  // the expensive filter + marker diff run against the deferred value.
  const deferredQuery = useDeferredValue(query);

  // Once a real location is known, distances are computed from it.
  const facilities = useMemo(() => {
    if (geoState !== "active") return FACILITIES;
    return FACILITIES.map((f) => ({
      ...f,
      distance: haversineKm(userPos, { lat: f.lat, lng: f.lng }),
    }));
  }, [geoState, userPos]);

  const filtered = useMemo(() => {
    const list = facilities.filter((f) => {
      if (typeFilter !== "all" && f.type !== typeFilter) return false;
      if (deferredQuery) {
        const q = normalizeForSearch(deferredQuery);
        const equip = f.equipment ?? [];
        const hay = normalizeForSearch(
          `${f.name} ${f.nameJa} ${f.area} ${f.tags.join(" ")} ${equip.join(" ")}`,
        );
        if (!hay.includes(q)) return false;
      }
      if (equipFilters.length) {
        const equip = f.equipment ?? [];
        const hasAll = equipFilters.every((eq) => equip.some((e) => e.includes(eq)));
        if (!hasAll) return false;
      }
      return true;
    });
    if (sort === "distance") list.sort((a, b) => a.distance - b.distance);
    if (sort === "rating") list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    if (sort === "price") list.sort((a, b) => priceValue(a.price) - priceValue(b.price));
    return list;
  }, [facilities, deferredQuery, typeFilter, equipFilters, sort]);

  const activeFacility = useMemo(
    () => facilities.find((f) => f.id === activeId) ?? null,
    [facilities, activeId],
  );

  // Hydrate search + selected facility from the URL (?q=, ?f=) on first mount,
  // so a shared link reopens the same view. `history` is used directly (rather
  // than next/navigation) so the page stays renderable without a router
  // context — which keeps it unit-testable in isolation.
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const q = sp.get("q");
    const f = sp.get("f");
    if (q) setQuery(q);
    if (f && FACILITIES.some((x) => x.id === f)) setActiveId(f);
  }, []);

  // Keep the URL in sync with the current view. The first run is skipped so the
  // mount-time hydration above is not clobbered with the still-default state.
  const urlSynced = useRef(false);
  useEffect(() => {
    if (!urlSynced.current) {
      urlSynced.current = true;
      return;
    }
    const sp = new URLSearchParams();
    if (query) sp.set("q", query);
    if (activeId) sp.set("f", activeId);
    const qs = sp.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [query, activeId]);

  const toggleEquip = (key: string) => {
    setEquipFilters((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const requestGeolocation = () => {
    if (geoState === "locating") return;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoState("error");
      setGeoMessage("このブラウザは位置情報に対応していません");
      return;
    }
    setGeoState("locating");
    setGeoMessage("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoState("active");
        setShowUser(true);
        setSort("distance");
      },
      (err) => {
        setGeoState("error");
        setGeoMessage(
          err.code === err.PERMISSION_DENIED
            ? "位置情報の利用が許可されていません"
            : err.code === err.TIMEOUT
              ? "位置情報の取得がタイムアウトしました"
              : "位置情報を取得できませんでした",
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  const dotColor =
    geoState === "locating"
      ? "var(--warn)"
      : geoState === "error"
        ? "var(--danger)"
        : showUser
          ? "oklch(0.7 0.2 240)"
          : "var(--ink-4)";
  const dotGlow =
    geoState === "locating"
      ? "0 0 6px var(--warn)"
      : geoState === "error"
        ? "0 0 6px var(--danger)"
        : showUser
          ? "0 0 6px oklch(0.7 0.2 240)"
          : "none";

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">A</div>
          <div>
            ACRO<span style={{ color: "var(--ink-3)" }}>/</span>FINDER
            <div className="jp">アクロバット練習施設</div>
          </div>
        </div>
        <nav className="top-nav">
          <span className="top-nav-link active">
            <span className="top-nav-icon">▣</span>施設マップ
          </span>
          <Link href="/facilities" className="top-nav-link">
            <span className="top-nav-icon">▤</span>施設一覧
          </Link>
          <Link href="/events" className="top-nav-link">
            <span className="top-nav-icon">◈</span>イベント
            <span className="top-nav-badge">{EVENT_COUNT}</span>
          </Link>
          <Link href="/skills" className="top-nav-link">
            <span className="top-nav-icon">◆</span>技ガイド
          </Link>
        </nav>
        <div className="search">
          <span className="search-icon">⌕</span>
          <input
            type="text"
            placeholder="施設名・エリア・器具で検索  (例: トランポリン、渋谷)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          className="pref-select"
          aria-label="都道府県へ移動"
          value={focusPref?.name ?? ""}
          onChange={(e) => {
            setFocusPref(PREFECTURES.find((p) => p.name === e.target.value) ?? null);
          }}
        >
          <option value="">都道府県へ移動</option>
          {PREFECTURES.map((p) => (
            <option key={p.name} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>
        <div className="topbar-actions">
          {geoState === "error" && <span className="geo-error">{geoMessage}</span>}
          {geoState === "active" && <span className="geo-ok">現在地を取得しました</span>}
          <button
            className="btn"
            onClick={requestGeolocation}
            disabled={geoState === "locating"}
            title="ブラウザの位置情報から現在地を取得します"
          >
            <span className="dot" style={{ background: dotColor, boxShadow: dotGlow }} />
            {geoState === "locating" ? "現在地を取得中…" : "現在地から探す"}
          </button>
        </div>
      </header>

      <div className="main">
        <aside className="list-pane">
          <div className="list-header">
            <div className="list-header-top">
              <div className="list-count">
                <strong>{filtered.length}</strong>件の施設
              </div>
              <div className="sort-toggle">
                <button
                  className={sort === "distance" ? "active" : ""}
                  onClick={() => setSort("distance")}
                >
                  距離
                </button>
                <button
                  className={sort === "rating" ? "active" : ""}
                  onClick={() => setSort("rating")}
                >
                  評価
                </button>
                <button
                  className={sort === "price" ? "active" : ""}
                  onClick={() => setSort("price")}
                >
                  料金
                </button>
              </div>
            </div>
            <div className="type-filters">
              {TYPE_FILTERS.map((tf) => (
                <button
                  key={tf.key}
                  className={`chip ${typeFilter === tf.key ? "active" : ""}`}
                  onClick={() => setTypeFilter(tf.key)}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>
          <div className="list-scroll">
            {filtered.length === 0 ? (
              <div className="empty">
                条件に合う施設が見つかりませんでした
                <br />
                <br />
                フィルターを調整してください
              </div>
            ) : (
              filtered.map((f) => (
                <FacilityCard
                  key={f.id}
                  facility={f}
                  active={activeId === f.id}
                  onClick={() => setActiveId(f.id)}
                />
              ))
            )}
          </div>
        </aside>

        <main className="map-pane">
          <InteractiveMap
            facilities={filtered}
            activeId={activeId}
            onSelect={setActiveId}
            userPos={userPos}
            showUser={showUser}
            onRecenter={() => setShowUser(true)}
            focusPref={focusPref}
          />

          <div className="map-overlay">
            <div className="equipment-filter">
              <span className="equipment-filter-label">器具で絞り込む</span>
              {EQUIPMENT_FILTERS.map((eq) => (
                <button
                  key={eq.key}
                  className={`eq-chip ${equipFilters.includes(eq.key) ? "active" : ""}`}
                  onClick={() => toggleEquip(eq.key)}
                >
                  <span className="icon">{eq.icon}</span>
                  {eq.key}
                </button>
              ))}
              {equipFilters.length > 0 && (
                <button
                  className="eq-chip"
                  onClick={() => setEquipFilters([])}
                  style={{ color: "var(--ink-3)" }}
                >
                  ✕ 解除
                </button>
              )}
            </div>
          </div>

          <div className="map-legend">
            <span className="swatch">施設</span>
            <span className="swatch active">選択中</span>
            <span className="swatch you">現在地</span>
            <span style={{ color: "var(--ink-4)", fontFamily: "var(--font-mono)", fontSize: 10 }}>
              ·
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10 }}>
              {filtered.length}/{facilities.length} 件表示中
            </span>
          </div>

          <DetailPanel facility={activeFacility} onClose={() => setActiveId(null)} />
        </main>
      </div>
    </div>
  );
}
