"use client";

import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  ViewTransition,
} from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { EQUIPMENT_FILTERS, FACILITIES, TYPE_FILTERS } from "@/lib/data";
import { EVENTS } from "@/lib/events-data";
import type { SortKey } from "@/lib/types";
import { PREFECTURES, type Prefecture } from "@/lib/prefectures";
import { haversineKm, normalizeForSearch, priceValue } from "@/lib/util";
import { loadFavorites, saveFavorites, toggleFavorite } from "@/lib/favorites";

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

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "distance", label: "距離" },
  { key: "price", label: "料金" },
];

export default function Page() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [equipFilters, setEquipFilters] = useState<string[]>([]);
  const [sort, setSort] = useState<SortKey>("distance");
  const [userPos, setUserPos] = useState(DEFAULT_POS);
  const [geoState, setGeoState] = useState<GeoState>("idle");
  const [geoMessage, setGeoMessage] = useState("");
  const [focusPref, setFocusPref] = useState<Prefecture | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favOnly, setFavOnly] = useState(false);
  // The user pin is only drawn for a real fix — before that the base point is
  // Tokyo Station, and a pin labelled 現在地 there would be a false statement.
  const located = geoState === "active";

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
      if (favOnly && !favorites.includes(f.id)) return false;
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
    if (sort === "price") list.sort((a, b) => priceValue(a.price) - priceValue(b.price));
    return list;
  }, [facilities, deferredQuery, typeFilter, equipFilters, sort, favOnly, favorites]);

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
    // Favourites are read here too (not in a useState initializer) so the
    // server-rendered HTML and the first client render agree.
    setFavorites(loadFavorites());
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

  // Filtering and sorting run inside a Transition so the <ViewTransition> around
  // each card can animate cards entering, leaving and moving. Typing is already
  // covered: `query` feeds `deferredQuery`, and a deferred value drives a
  // Transition too. These setters are discrete clicks, so making them
  // non-urgent costs nothing perceptible on a ~100 item local filter.
  const selectType = (key: string) => {
    startTransition(() => setTypeFilter(key));
  };

  const selectSort = (key: SortKey) => {
    startTransition(() => setSort(key));
  };

  const toggleEquip = (key: string) => {
    startTransition(() =>
      setEquipFilters((prev) =>
        prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
      ),
    );
  };

  const clearEquip = () => {
    startTransition(() => setEquipFilters([]));
  };

  const clearAll = () => {
    setQuery("");
    startTransition(() => {
      setTypeFilter("all");
      setEquipFilters([]);
      setFavOnly(false);
    });
  };

  const toggleFav = (id: string) => {
    setFavorites((prev) => {
      const next = toggleFavorite(prev, id);
      saveFavorites(next);
      return next;
    });
  };

  // Esc closes the detail panel, which covers the whole screen on phones.
  useEffect(() => {
    if (!activeId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeId]);

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
        : located
          ? "oklch(0.7 0.2 240)"
          : "var(--ink-4)";
  const dotGlow =
    geoState === "locating"
      ? "0 0 6px var(--warn)"
      : geoState === "error"
        ? "0 0 6px var(--danger)"
        : located
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
            type="search"
            aria-label="施設を検索"
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
          {/* Kept mounted so screen readers announce the result when it appears. */}
          <span className="geo-status" role="status">
            {geoState === "error" && <span className="geo-error">{geoMessage}</span>}
            {geoState === "active" && <span className="geo-ok">現在地を取得しました</span>}
          </span>
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
              <div className="sort-toggle" role="group" aria-label="並び順">
                {SORT_OPTIONS.map((o) => (
                  <button
                    key={o.key}
                    className={sort === o.key ? "active" : ""}
                    aria-pressed={sort === o.key}
                    onClick={() => selectSort(o.key)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <p className="list-distance-note">
              {located
                ? "距離は現在地からの直線距離です"
                : "距離は東京駅からの直線距離です（「現在地から探す」で切り替え）"}
            </p>
            <div className="type-filters">
              {TYPE_FILTERS.map((tf) => (
                <button
                  key={tf.key}
                  className={`chip ${typeFilter === tf.key ? "active" : ""}`}
                  aria-pressed={typeFilter === tf.key}
                  onClick={() => selectType(tf.key)}
                >
                  {tf.label}
                </button>
              ))}
              <button
                className={`chip fav-chip ${favOnly ? "active" : ""}`}
                aria-pressed={favOnly}
                onClick={() => startTransition(() => setFavOnly((v) => !v))}
                title="詳細パネルの ☆ で追加した施設だけを表示します"
              >
                <span aria-hidden>★</span> お気に入り {favorites.length}
              </button>
            </div>
          </div>
          <div className="list-scroll">
            {filtered.length === 0 ? (
              <div className="empty">
                <p>条件に合う施設が見つかりませんでした。</p>
                <p>キーワードを短くするか、種別・器具の絞り込みを外すと見つかることがあります。</p>
                <button className="btn" onClick={clearAll}>
                  条件をすべて解除
                </button>
              </div>
            ) : (
              filtered.map((f) => (
                // A stable `name` per facility is what lets React recognise the
                // same card across a filter or sort change, so a card that only
                // moved animates to its new position instead of cross-fading as
                // if it were a different card. Names must be unique in the
                // document at any one time — facility ids already are.
                <ViewTransition key={f.id} name={`facility-${f.id}`}>
                  <FacilityCard
                    facility={f}
                    active={activeId === f.id}
                    favorite={favorites.includes(f.id)}
                    onClick={() => setActiveId(f.id)}
                  />
                </ViewTransition>
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
            showUser={located}
            focusPref={focusPref}
          />

          <div className="map-overlay">
            <div className="equipment-filter">
              <span className="equipment-filter-label">器具で絞り込む</span>
              {EQUIPMENT_FILTERS.map((eq) => (
                <button
                  key={eq.key}
                  className={`eq-chip ${equipFilters.includes(eq.key) ? "active" : ""}`}
                  aria-pressed={equipFilters.includes(eq.key)}
                  onClick={() => toggleEquip(eq.key)}
                >
                  <span className="icon" aria-hidden>
                    {eq.icon}
                  </span>
                  {eq.key}
                </button>
              ))}
              {equipFilters.length > 0 && (
                <button
                  className="eq-chip"
                  onClick={clearEquip}
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
            {located && <span className="swatch you">現在地</span>}
            <span style={{ color: "var(--ink-4)", fontFamily: "var(--font-mono)", fontSize: 10 }}>
              ·
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10 }}>
              {filtered.length}/{facilities.length} 件表示中
            </span>
          </div>

          <DetailPanel
            facility={activeFacility}
            onClose={() => setActiveId(null)}
            favorite={!!activeId && favorites.includes(activeId)}
            onToggleFavorite={() => activeId && toggleFav(activeId)}
            located={located}
          />
        </main>
      </div>
    </div>
  );
}
