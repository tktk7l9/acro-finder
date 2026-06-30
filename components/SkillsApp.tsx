"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { SKILLS, SKILL_GENRES, type Skill, type SkillGenre } from "@/lib/skills-data";
import { SkillArt } from "./SkillArt";
import { SkillGraph } from "./SkillGraph";

type LayoutMode = "grid" | "list" | "graph";

const COMBO_MAX = 12;

// English discipline word used to disambiguate the video search query.
const DISCIPLINE_EN: Record<SkillGenre, string> = {
  tricking: "tricking",
  parkour: "parkour",
  gym: "gymnastics",
  break: "breakdance",
  ski: "freeski",
  snow: "snowboard",
};

function videoSearchUrl(skill: Skill): string {
  const q = `${skill.name_en} ${DISCIPLINE_EN[skill.genre]} tutorial`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
}

type SortKey = "lv-asc" | "lv-desc" | "az" | "genre";

function loadSet(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(key) || "[]"));
  } catch {
    return new Set();
  }
}
function loadArr(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

export function SkillsApp() {
  const byId = useMemo(() => Object.fromEntries(SKILLS.map((s) => [s.id, s])), []);

  const [genre, setGenre] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [lvMin, setLvMin] = useState(1);
  const [lvMax, setLvMax] = useState(10);
  const [activeTags, setActiveTags] = useState<Set<string>>(() => new Set());
  const [sort, setSort] = useState<SortKey>("lv-asc");
  const [layout, setLayout] = useState<LayoutMode>("grid");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showFavOnly, setShowFavOnly] = useState(false);
  const [showDoneOnly, setShowDoneOnly] = useState(false);
  const [comboCollapsed, setComboCollapsed] = useState(false);

  const [favs, setFavs] = useState<Set<string>>(() => new Set());
  const [dones, setDones] = useState<Set<string>>(() => new Set());
  const [combo, setCombo] = useState<string[]>([]);

  // Load persisted state once on mount (avoids SSR hydration mismatch).
  const loaded = useRef(false);
  useEffect(() => {
    setFavs(loadSet("acro_skill_favs"));
    setDones(loadSet("acro_skill_dones"));
    setCombo(loadArr("acro_skill_combo"));
    loaded.current = true;
  }, []);
  useEffect(() => {
    if (loaded.current) localStorage.setItem("acro_skill_favs", JSON.stringify([...favs]));
  }, [favs]);
  useEffect(() => {
    if (loaded.current) localStorage.setItem("acro_skill_dones", JSON.stringify([...dones]));
  }, [dones]);
  useEffect(() => {
    if (loaded.current) localStorage.setItem("acro_skill_combo", JSON.stringify(combo));
  }, [combo]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.querySelector<HTMLInputElement>(".skills-app .search input")?.focus();
      }
      if (e.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const allTags = useMemo(() => {
    const counts: Record<string, number> = {};
    SKILLS.forEach((s) => s.tags.forEach((t) => (counts[t] = (counts[t] || 0) + 1)));
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([t]) => t);
  }, []);

  const genreCounts = useMemo(() => {
    const out: Record<string, number> = { all: SKILLS.length };
    SKILLS.forEach((s) => (out[s.genre] = (out[s.genre] || 0) + 1));
    return out;
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = SKILLS.filter((s) => {
      if (genre !== "all" && s.genre !== genre) return false;
      if (s.lv < lvMin || s.lv > lvMax) return false;
      if (activeTags.size > 0 && !s.tags.some((t) => activeTags.has(t))) return false;
      if (showFavOnly && !favs.has(s.id)) return false;
      if (showDoneOnly && !dones.has(s.id)) return false;
      if (q) {
        const blob =
          `${s.name_ja} ${s.name_en} ${s.id} ${s.tags.join(" ")} ${s.desc_ja} ${s.desc_en}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
    if (sort === "lv-asc") list.sort((a, b) => a.lv - b.lv);
    if (sort === "lv-desc") list.sort((a, b) => b.lv - a.lv);
    if (sort === "az") list.sort((a, b) => a.name_en.localeCompare(b.name_en));
    if (sort === "genre") list.sort((a, b) => a.genre.localeCompare(b.genre) || a.lv - b.lv);
    return list;
  }, [genre, search, lvMin, lvMax, activeTags, sort, showFavOnly, showDoneOnly, favs, dones]);

  const toggleTag = (tag: string) =>
    setActiveTags((prev) => {
      const n = new Set(prev);
      if (n.has(tag)) n.delete(tag);
      else n.add(tag);
      return n;
    });
  const toggleFav = (id: string) =>
    setFavs((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const toggleDone = (id: string) =>
    setDones((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const addToCombo = (id: string) =>
    setCombo((prev) => (prev.length >= COMBO_MAX ? prev : [...prev, id]));
  const removeFromCombo = (idx: number) =>
    setCombo((prev) => prev.filter((_, i) => i !== idx));

  const selected = selectedId ? byId[selectedId] : null;

  return (
    <div className="skills-app">
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
          <Link href="/events" className="top-nav-link">
            <span className="top-nav-icon">◈</span>イベント
          </Link>
          <span className="top-nav-link active">
            <span className="top-nav-icon">◆</span>技ガイド
            <span className="top-nav-badge">{SKILLS.length}</span>
          </span>
        </nav>
        <div className="search">
          <span className="search-icon">⌕</span>
          <input
            type="text"
            placeholder="技名・タグで検索（⌘K）"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="topbar-actions">
          <button
            className={`btn${showFavOnly ? " btn-primary" : ""}`}
            onClick={() => setShowFavOnly((v) => !v)}
          >
            ★ お気に入り {favs.size}
          </button>
          <button
            className={`btn${showDoneOnly ? " btn-primary" : ""}`}
            onClick={() => setShowDoneOnly((v) => !v)}
          >
            ✓ 習得済み {dones.size}
          </button>
        </div>
      </header>

      <nav className="skl-genrebar">
        {SKILL_GENRES.map((g) => (
          <button
            key={g.id}
            className={`skl-genre-tab${genre === g.id ? " active" : ""}`}
            onClick={() => setGenre(g.id)}
          >
            <span className="gt-en">{g.abbr}</span>
            <span className="gt-ja">{g.name_ja}</span>
            <span className="gt-count">[ {genreCounts[g.id] || 0} ]</span>
          </button>
        ))}
      </nav>

      <FilterBar
        lvMin={lvMin}
        lvMax={lvMax}
        setLvMin={setLvMin}
        setLvMax={setLvMax}
        allTags={allTags}
        activeTags={activeTags}
        toggleTag={toggleTag}
        sort={sort}
        setSort={setSort}
        layout={layout}
        setLayout={setLayout}
        filteredCount={filtered.length}
        totalCount={SKILLS.length}
      />

      <div className="skl-main">
        <div className="skl-gridwrap">
          {layout === "graph" ? (
            <SkillGraph
              skills={filtered}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          ) : filtered.length === 0 ? (
            <div className="skl-empty">
              <div className="skl-empty-glyph">∅</div>
              <div className="skl-empty-text">該当する技が見つかりません</div>
            </div>
          ) : (
            <div className={`skl-grid${layout === "list" ? " list" : ""}`}>
              {filtered.map((s) => (
                <SkillCard
                  key={s.id}
                  skill={s}
                  layout={layout}
                  selected={selectedId === s.id}
                  isFav={favs.has(s.id)}
                  isDone={dones.has(s.id)}
                  onClick={() => setSelectedId(s.id)}
                  onFav={() => toggleFav(s.id)}
                  onDone={() => toggleDone(s.id)}
                />
              ))}
            </div>
          )}
        </div>

        <SkillPanel
          skill={selected}
          byId={byId}
          isFav={selected ? favs.has(selected.id) : false}
          isDone={selected ? dones.has(selected.id) : false}
          inCombo={combo.length >= COMBO_MAX}
          onClose={() => setSelectedId(null)}
          onFav={() => selected && toggleFav(selected.id)}
          onDone={() => selected && toggleDone(selected.id)}
          onAddCombo={() => selected && addToCombo(selected.id)}
          onJump={(id) => setSelectedId(id)}
        />
      </div>

      <ComboDock
        combo={combo}
        byId={byId}
        collapsed={comboCollapsed}
        setCollapsed={setComboCollapsed}
        onRemove={removeFromCombo}
        onClear={() => setCombo([])}
      />
    </div>
  );
}

// ─────────── FilterBar ───────────
function FilterBar({
  lvMin,
  lvMax,
  setLvMin,
  setLvMax,
  allTags,
  activeTags,
  toggleTag,
  sort,
  setSort,
  layout,
  setLayout,
  filteredCount,
  totalCount,
}: {
  lvMin: number;
  lvMax: number;
  setLvMin: (v: number) => void;
  setLvMax: (v: number) => void;
  allTags: string[];
  activeTags: Set<string>;
  toggleTag: (t: string) => void;
  sort: SortKey;
  setSort: (s: SortKey) => void;
  layout: LayoutMode;
  setLayout: (l: LayoutMode) => void;
  filteredCount: number;
  totalCount: number;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<"min" | "max" | null>(null);

  const handleMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!dragRef.current || !trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const v = Math.round(1 + pct * 9);
      if (dragRef.current === "min") setLvMin(Math.min(v, lvMax));
      else setLvMax(Math.max(v, lvMin));
    },
    [lvMin, lvMax, setLvMin, setLvMax],
  );

  useEffect(() => {
    const up = () => (dragRef.current = null);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchend", up);
    };
  }, [handleMove]);

  const minPct = ((lvMin - 1) / 9) * 100;
  const maxPct = ((lvMax - 1) / 9) * 100;

  return (
    <div className="skl-filterbar">
      <div className="skl-fb-group">
        <span className="skl-fb-label">難易度</span>
        <div className="skl-lv-range">
          <span className="skl-lv-pill">Lv.{lvMin}</span>
          <div className="skl-lv-track" ref={trackRef}>
            <div
              className="skl-lv-fill"
              style={{ left: `${minPct}%`, width: `${maxPct - minPct}%` }}
            />
            <div
              className="skl-lv-thumb"
              style={{ left: `${minPct}%` }}
              onMouseDown={() => (dragRef.current = "min")}
              onTouchStart={() => (dragRef.current = "min")}
            />
            <div
              className="skl-lv-thumb"
              style={{ left: `${maxPct}%` }}
              onMouseDown={() => (dragRef.current = "max")}
              onTouchStart={() => (dragRef.current = "max")}
            />
          </div>
          <span className="skl-lv-pill">Lv.{lvMax}</span>
        </div>
      </div>

      <div className="skl-fb-group">
        <span className="skl-fb-label">タグ</span>
        <div className="skl-tag-chips">
          {allTags.slice(0, 8).map((tag) => (
            <button
              key={tag}
              className={`skl-tag-chip${activeTags.has(tag) ? " active" : ""}`}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="skl-fb-group">
        <span className="skl-fb-label">並び</span>
        <select
          className="skl-select"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
        >
          <option value="lv-asc">難易度 低→高</option>
          <option value="lv-desc">難易度 高→低</option>
          <option value="az">A → Z</option>
          <option value="genre">ジャンル順</option>
        </select>
      </div>

      <div className="skl-fb-group">
        <span className="skl-fb-label">表示</span>
        <div className="skl-layout-toggle">
          <button
            className={layout === "grid" ? "active" : ""}
            onClick={() => setLayout("grid")}
          >
            ▦ Grid
          </button>
          <button
            className={layout === "list" ? "active" : ""}
            onClick={() => setLayout("list")}
          >
            ▤ List
          </button>
          <button
            className={layout === "graph" ? "active" : ""}
            onClick={() => setLayout("graph")}
          >
            ❖ 相関図
          </button>
        </div>
      </div>

      <div className="skl-fb-spacer" />

      <div className="skl-fb-count">
        <span className="num">{String(filteredCount).padStart(2, "0")}</span>
        <span className="total"> / {totalCount}</span>
      </div>
    </div>
  );
}

// ─────────── SkillCard ───────────
function SkillCard({
  skill,
  layout,
  selected,
  isFav,
  isDone,
  onClick,
  onFav,
  onDone,
}: {
  skill: Skill;
  layout: LayoutMode;
  selected: boolean;
  isFav: boolean;
  isDone: boolean;
  onClick: () => void;
  onFav: () => void;
  onDone: () => void;
}) {
  return (
    <div className={`skl-card${selected ? " active" : ""}`} onClick={onClick}>
      <div className="skl-card-media">
        <SkillArt skill={skill} />
        <div className="skl-card-id">{skill.id}</div>
        <div className="skl-card-lv">
          <span className="n">{skill.lv}</span>
          <span className="l">LV</span>
        </div>
        <button
          className={`skl-card-iconbtn fav${isFav ? " active" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            onFav();
          }}
          aria-label="お気に入り"
        >
          {isFav ? "★" : "☆"}
        </button>
        <button
          className={`skl-card-iconbtn done${isDone ? " active" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            onDone();
          }}
          aria-label="習得済み"
        >
          ✓
        </button>
      </div>
      <div className="skl-card-body">
        <div className="skl-card-nameblock">
          <div className="skl-card-name">{skill.name_ja}</div>
          <div className="skl-card-name-en">{skill.name_en}</div>
        </div>
        {layout === "list" && <div className="skl-card-desc">{skill.desc_ja}</div>}
        <div className="skl-card-tags">
          {skill.tags.map((tg) => (
            <span key={tg} className="skl-tag">
              {tg}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────── SkillPanel ───────────
function SkillPanel({
  skill,
  byId,
  isFav,
  isDone,
  inCombo,
  onClose,
  onFav,
  onDone,
  onAddCombo,
  onJump,
}: {
  skill: Skill | null;
  byId: Record<string, Skill>;
  isFav: boolean;
  isDone: boolean;
  inCombo: boolean;
  onClose: () => void;
  onFav: () => void;
  onDone: () => void;
  onAddCombo: () => void;
  onJump: (id: string) => void;
}) {
  if (!skill) return <aside className="skl-panel" />;

  const genre = SKILL_GENRES.find((g) => g.id === skill.genre);
  const prereqList = skill.prereqs.map((id) => byId[id]).filter(Boolean);
  const leadsList = skill.leads.map((id) => byId[id]).filter(Boolean);

  return (
    <aside className="skl-panel open">
      <div className="skl-panel-inner">
        <div className="skl-sp-video">
          <SkillArt skill={skill} />
          <a
            className="skl-sp-play"
            href={videoSearchUrl(skill)}
            target="_blank"
            rel="noreferrer"
          >
            ▶ YouTubeで動画を見る
          </a>
          <button className="skl-sp-close" onClick={onClose} aria-label="閉じる">
            ✕
          </button>
        </div>

        <div className="skl-sp-header">
          <div className="skl-sp-genre">
            <span className="skl-sp-genre-dot" />
            {genre?.name_ja ?? skill.genre}
            <span className="id">ID · {skill.id}</span>
          </div>
          <div className="skl-sp-name">{skill.name_ja}</div>
          <div className="skl-sp-name-en">{skill.name_en}</div>
        </div>

        <div className="skl-sp-meta">
          <div className="skl-sp-meta-cell">
            <div className="skl-sp-meta-k">Level</div>
            <div className="skl-sp-meta-v accent">{skill.lv}/10</div>
          </div>
          <div className="skl-sp-meta-cell">
            <div className="skl-sp-meta-k">前提技</div>
            <div className="skl-sp-meta-v">{prereqList.length || "—"}</div>
          </div>
          <div className="skl-sp-meta-cell">
            <div className="skl-sp-meta-k">派生技</div>
            <div className="skl-sp-meta-v">{leadsList.length || "—"}</div>
          </div>
        </div>

        <div className="skl-sp-actions">
          <button
            className={`skl-sp-action${isFav ? " active" : ""}`}
            onClick={onFav}
          >
            {isFav ? "★" : "☆"} お気に入り
          </button>
          <button
            className={`skl-sp-action${isDone ? " active" : ""}`}
            onClick={onDone}
          >
            ✓ 習得済み
          </button>
        </div>

        <div className="skl-sp-section">
          <div className="skl-sp-section-head">
            <h3>解説</h3>
            <span className="en">DESCRIPTION</span>
            <span className="skl-sp-section-bar" />
          </div>
          <div className="skl-sp-desc">{skill.desc_ja}</div>
          <div className="skl-sp-desc-en">{skill.desc_en}</div>
        </div>

        <div className="skl-sp-section">
          <div className="skl-sp-section-head">
            <h3>コツ</h3>
            <span className="en">KEY POINTS</span>
            <span className="skl-sp-section-bar" />
            <span className="skl-sp-section-num">{skill.tips_ja.length} pts</span>
          </div>
          <ul className="skl-sp-tips">
            {skill.tips_ja.map((tip, i) => (
              <li key={i} className="skl-sp-tip">
                <span className="skl-sp-tip-num">0{i + 1}</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="skl-sp-section">
          <div className="skl-sp-section-head">
            <h3>前提技・派生技</h3>
            <span className="en">PROGRESSION</span>
            <span className="skl-sp-section-bar" />
          </div>

          <div className="skl-sp-rel-label">↳ 前提技</div>
          <div className="skl-sp-rel" style={{ marginBottom: 14 }}>
            {prereqList.length === 0 ? (
              <div className="skl-sp-rel-empty">前提技なし — 基礎技</div>
            ) : (
              prereqList.map((p) => (
                <div
                  key={p.id}
                  className="skl-sp-rel-item"
                  onClick={() => onJump(p.id)}
                >
                  <span className="skl-sp-rel-arrow">←</span>
                  <span className="skl-sp-rel-name">{p.name_ja}</span>
                  <span className="skl-sp-rel-en">{p.name_en}</span>
                  <span className="skl-sp-rel-lv">Lv.{p.lv}</span>
                </div>
              ))
            )}
          </div>

          <div className="skl-sp-rel-label">↳ 派生技</div>
          <div className="skl-sp-rel">
            {leadsList.length === 0 ? (
              <div className="skl-sp-rel-empty">派生技なし</div>
            ) : (
              leadsList.map((p) => (
                <div
                  key={p.id}
                  className="skl-sp-rel-item"
                  onClick={() => onJump(p.id)}
                >
                  <span className="skl-sp-rel-arrow">→</span>
                  <span className="skl-sp-rel-name">{p.name_ja}</span>
                  <span className="skl-sp-rel-en">{p.name_en}</span>
                  <span className="skl-sp-rel-lv">Lv.{p.lv}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="skl-sp-section" style={{ borderBottom: 0 }}>
          <button className="skl-sp-addcombo btn" onClick={onAddCombo} disabled={inCombo}>
            ＋ {inCombo ? "コンボが満員です" : "コンボに追加"}
          </button>
        </div>
      </div>
    </aside>
  );
}

// ─────────── ComboDock ───────────
function ComboDock({
  combo,
  byId,
  collapsed,
  setCollapsed,
  onRemove,
  onClear,
}: {
  combo: string[];
  byId: Record<string, Skill>;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  onRemove: (idx: number) => void;
  onClear: () => void;
}) {
  const totalLv = combo.reduce((sum, id) => sum + (byId[id]?.lv || 0), 0);

  return (
    <div className={`skl-combo${collapsed ? " collapsed" : ""}`}>
      <button
        className="skl-combo-toggle"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? "▲ 展開" : "▼ 折りたたみ"}
      </button>

      <div className="skl-combo-head">
        <div className="skl-combo-title">コンボビルダー</div>
        <div className="skl-combo-sub">COMBO BUILDER · {combo.length}/{COMBO_MAX}</div>
      </div>

      {!collapsed && (
        <>
          <div className="skl-combo-strip">
            {combo.length === 0 ? (
              <div className="skl-combo-empty">— カードや詳細から技を追加できます —</div>
            ) : (
              combo.map((id, idx) => {
                const s = byId[id];
                if (!s) return null;
                return (
                  <div
                    key={`${idx}_${id}`}
                    style={{ display: "flex", alignItems: "center", gap: 7 }}
                  >
                    {idx > 0 && <span className="skl-combo-arrow">▸</span>}
                    <div className="skl-combo-slot">
                      <div className="skl-combo-slot-num">
                        #{String(idx + 1).padStart(2, "0")}
                      </div>
                      <div className="skl-combo-slot-name">{s.name_ja}</div>
                      <div className="skl-combo-slot-lv">
                        Lv.{s.lv} · {s.genre}
                      </div>
                      <button
                        className="skl-combo-slot-x"
                        onClick={() => onRemove(idx)}
                        aria-label="削除"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="skl-combo-summary">
            <div className="skl-combo-stat">
              <span>技数</span>
              <strong>{combo.length}</strong>
            </div>
            <div className="skl-combo-stat">
              <span>合計Lv</span>
              <strong>{totalLv}</strong>
            </div>
            <div className="skl-combo-actions">
              <button className="btn" onClick={onClear} disabled={combo.length === 0}>
                クリア
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
