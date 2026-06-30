"use client";

import { useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { EVENT_TYPES, EVENTS, eventStatus } from "@/lib/events-data";
import { fmtEventDate, todayJst } from "@/lib/util";
import { EventCard } from "./EventCard";
import { FeaturedEvent } from "./FeaturedEvent";

type StatusFilter = "all" | "open" | "past";

const STATUS_OPTIONS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "すべて" },
  { key: "open", label: "開催予定" },
  { key: "past", label: "開催済み" },
];

export function EventsFeed() {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");

  const today = useMemo(() => todayJst(), []);
  const featured = useMemo(() => EVENTS.find((e) => e.featured), []);

  const filtered = useMemo(() => {
    const list = EVENTS.filter((e) => {
      if (typeFilter !== "all" && e.type !== typeFilter) return false;
      const st = eventStatus(e, today);
      if (statusFilter === "open" && st === "past") return false;
      if (statusFilter === "past" && st !== "past") return false;
      if (query) {
        const q = query.toLowerCase();
        const hay =
          `${e.title} ${e.titleJa} ${e.description} ${e.venue ?? ""} ${(e.tags ?? []).join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    // Upcoming first (soonest first), then past (most recent first).
    list.sort((a, b) => {
      const ap = eventStatus(a, today) === "past";
      const bp = eventStatus(b, today) === "past";
      if (ap !== bp) return ap ? 1 : -1;
      return ap ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date);
    });
    return list;
  }, [typeFilter, statusFilter, query, today]);

  const grouped = useMemo(() => {
    const m = new Map<
      string,
      { key: string; label: string; en: string; num: number; events: typeof EVENTS }
    >();
    for (const e of filtered) {
      const f = fmtEventDate(e.date);
      if (!m.has(f.monthKey)) {
        m.set(f.monthKey, {
          key: f.monthKey,
          label: f.monthLabel,
          en: f.monthEn,
          num: f.monthNum,
          events: [],
        });
      }
      m.get(f.monthKey)!.events.push(e);
    }
    return Array.from(m.values());
  }, [filtered]);

  const typeCounts = useMemo(() => {
    const c: Record<string, number> = { all: EVENTS.length };
    for (const e of EVENTS) c[e.type] = (c[e.type] || 0) + 1;
    return c;
  }, []);

  const showFeatured =
    featured &&
    eventStatus(featured, today) !== "past" &&
    statusFilter !== "past" &&
    typeFilter === "all" &&
    !query;

  return (
    <div className="events-app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">A</div>
          <div>
            ACRO<span style={{ color: "var(--ink-3)" }}>/</span>FINDER
            <div className="jp">アクロバット練習施設</div>
          </div>
        </div>
        <nav className="top-nav">
          <Link href="/" className="top-nav-link">
            <span className="top-nav-icon">▣</span>施設マップ
          </Link>
          <span className="top-nav-link active">
            <span className="top-nav-icon">◈</span>イベント
            <span className="top-nav-badge">{EVENTS.length}</span>
          </span>
          <Link href="/skills" className="top-nav-link">
            <span className="top-nav-icon">◆</span>技ガイド
          </Link>
        </nav>
        <div className="search">
          <span className="search-icon">⌕</span>
          <input
            type="text"
            placeholder="大会名・会場・タグで検索"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="topbar-actions">
          <button className="btn">📅 カレンダー表示</button>
          <button className="btn-primary btn">＋ イベント主催</button>
        </div>
      </header>

      <div className="events-main">
        <aside className="events-sidebar">
          <div className="sidebar-section">
            <h4 className="sidebar-title">Status / 状態</h4>
            <div className="filter-list">
              {STATUS_OPTIONS.map((s) => (
                <div
                  key={s.key}
                  className={`filter-row ${statusFilter === s.key ? "active" : ""}`}
                  onClick={() => setStatusFilter(s.key)}
                  style={
                    {
                      "--ind": statusFilter === s.key ? "var(--accent)" : "var(--ink-4)",
                    } as CSSProperties
                  }
                >
                  <span className="lbl">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <h4 className="sidebar-title">Type / 種別</h4>
            <div className="filter-list">
              {EVENT_TYPES.map((t) => (
                <div
                  key={t.key}
                  className={`filter-row ${typeFilter === t.key ? "active" : ""}`}
                  onClick={() => setTypeFilter(t.key)}
                  style={{ "--ind": t.color } as CSSProperties}
                >
                  <span className="lbl">{t.label}</span>
                  <span className="count">{typeCounts[t.key] || 0}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <p
              style={{
                fontSize: 11,
                lineHeight: 1.7,
                color: "var(--ink-4)",
                margin: 0,
              }}
            >
              全国のパルクール・トリッキング大会・イベント情報。今後の開催と過去の記録。出典:
              PTvillage 大会・イベントアーカイブ。
            </p>
          </div>
        </aside>

        <main className="events-feed">
          <div className="feed-header">
            <h1 className="feed-title">
              EVENTS &amp; COMPETITIONS
              <span className="ja">パルクール・トリッキング大会カレンダー</span>
            </h1>
            <div className="feed-stats">
              <div className="feed-stat">
                <div className="v">
                  <span className="accent">{filtered.length}</span>
                </div>
                <div className="k">Total</div>
              </div>
              <div className="feed-stat">
                <div className="v">{filtered.filter((e) => e.type === "comp").length}</div>
                <div className="k">Comps</div>
              </div>
              <div className="feed-stat">
                <div className="v">
                  {filtered.filter((e) => eventStatus(e, today) !== "past").length}
                </div>
                <div className="k">Upcoming</div>
              </div>
            </div>
          </div>

          {showFeatured && featured && <FeaturedEvent event={featured} />}

          {filtered.length === 0 && (
            <div className="empty" style={{ padding: "80px 20px" }}>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--ink-4)",
                  fontSize: 11,
                  letterSpacing: "0.2em",
                  marginBottom: 14,
                }}
              >
                NO EVENTS FOUND
              </div>
              <div>
                条件に一致するイベントがありません
                <br />
                フィルターを調整してください
              </div>
            </div>
          )}

          {grouped.map((g) => (
            <section key={g.key}>
              <div className="month-divider">
                <span className="num">{g.num}</span>
                <span className="lbl">
                  <span className="en">
                    {g.en} {g.key.slice(0, 4)}
                  </span>
                  <span className="ja">{g.label}</span>
                </span>
                <span className="count">{g.events.length} 件</span>
              </div>
              <div>
                {g.events.map((e) => (
                  <EventCard key={e.id} event={e} />
                ))}
              </div>
            </section>
          ))}
        </main>
      </div>
    </div>
  );
}
