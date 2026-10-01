"use client";

import {
  type KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { TopNav } from "./TopNav";
import { SKILLS, SKILL_GENRES, type Skill, type SkillGenre } from "@/lib/skills-data";
import { SkillArt } from "./SkillArt";
import { SkillGraph } from "./SkillGraph";
import { normalizeForSearch } from "@/lib/util";
import { usePanelHistory } from "@/lib/panel-history";

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

// Saved state is only trusted when it is an array of ids that still exist:
// a stale or hand-edited entry would otherwise sit in the combo as an
// invisible slot that counts toward the limit and cannot be removed.
function loadIds(key: string, known: Record<string, unknown>): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string" && id in known);
  } catch {
    return [];
  }
}

function isTextEntry(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);
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
  // The open skill is mirrored into `?s=` (hydrated on mount, below) so a
  // skill can be linked to and the back button closes its panel (SHIG 76, 60).
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const applyUrlState = useCallback(
    (sp: URLSearchParams): boolean => {
      const id = sp.get("s");
      const valid = id !== null && id in byId;
      setSelectedId(valid ? id : null);
      return valid;
    },
    [byId],
  );
  const closePanel = usePanelHistory({
    panelOpen: selectedId !== null,
    search: selectedId ? `?s=${encodeURIComponent(selectedId)}` : "",
    restore: applyUrlState,
  });
  const closeSelected = useCallback(
    () => closePanel(() => setSelectedId(null)),
    [closePanel],
  );
  const [showFavOnly, setShowFavOnly] = useState(false);
  const [showDoneOnly, setShowDoneOnly] = useState(false);
  const [comboCollapsed, setComboCollapsed] = useState(false);
  // The combo as it was right before "クリア", kept so the clear can be undone.
  const [clearedCombo, setClearedCombo] = useState<string[] | null>(null);

  const [favs, setFavs] = useState<Set<string>>(() => new Set());
  const [dones, setDones] = useState<Set<string>>(() => new Set());
  const [combo, setCombo] = useState<string[]>([]);

  // Load persisted state once on mount (avoids SSR hydration mismatch).
  // `hydrated` is state, not a ref: the save effects below run in the same
  // commit as this one, and a ref flipped here would already be true for them,
  // so they would write the still-empty defaults over what was just read.
  // Under StrictMode (next dev) the re-mount then reads that empty list back
  // and a reload loses the saved combo. As state, the flag only becomes true
  // in the render that also carries the loaded values.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    applyUrlState(new URLSearchParams(window.location.search));
    setFavs(new Set(loadIds("acro_skill_favs", byId)));
    setDones(new Set(loadIds("acro_skill_dones", byId)));
    setCombo(loadIds("acro_skill_combo", byId));
    // On a phone the expanded builder covers a third of the screen; start it
    // folded there so the skill list is what you see first (SHIG 82).
    if (window.matchMedia?.("(max-width: 720px)").matches) setComboCollapsed(true);
    setHydrated(true);
  }, [applyUrlState, byId]);
  useEffect(() => {
    if (hydrated) localStorage.setItem("acro_skill_favs", JSON.stringify([...favs]));
  }, [hydrated, favs]);
  useEffect(() => {
    if (hydrated) localStorage.setItem("acro_skill_dones", JSON.stringify([...dones]));
  }, [hydrated, dones]);
  useEffect(() => {
    if (hydrated) localStorage.setItem("acro_skill_combo", JSON.stringify(combo));
  }, [hydrated, combo]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.querySelector<HTMLInputElement>(".skills-app .search input")?.focus();
      }
      // In a text field Esc belongs to the field (a search box clears itself).
      if (e.key === "Escape" && !isTextEntry(e.target)) closeSelected();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeSelected]);

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
    // Kana-folded so ひらがな finds カタカナ names (SHIG 50), as on the map page.
    const q = normalizeForSearch(search.trim());
    const list = SKILLS.filter((s) => {
      if (genre !== "all" && s.genre !== genre) return false;
      if (s.lv < lvMin || s.lv > lvMax) return false;
      if (activeTags.size > 0 && !s.tags.some((t) => activeTags.has(t))) return false;
      if (showFavOnly && !favs.has(s.id)) return false;
      if (showDoneOnly && !dones.has(s.id)) return false;
      if (q) {
        const blob = normalizeForSearch(
          `${s.name_ja} ${s.name_en} ${s.id} ${s.tags.join(" ")} ${s.desc_ja} ${s.desc_en}`,
        );
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
  const addToCombo = (id: string) => {
    setClearedCombo(null);
    setCombo((prev) => (prev.length >= COMBO_MAX ? prev : [...prev, id]));
  };
  const removeFromCombo = (idx: number) =>
    setCombo((prev) => prev.filter((_, i) => i !== idx));
  // Clear at once, offer undo instead of asking first (SHIG 57, 54).
  const clearCombo = () => {
    setClearedCombo(combo);
    setCombo([]);
  };
  const undoClear = () => {
    if (clearedCombo) setCombo(clearedCombo);
    setClearedCombo(null);
  };

  const selected = selectedId ? byId[selectedId] : null;

  const clearAll = () => {
    setSearch("");
    setGenre("all");
    setLvMin(1);
    setLvMax(10);
    setActiveTags(new Set());
    setShowFavOnly(false);
    setShowDoneOnly(false);
  };

  return (
    <div className="skills-app">
      <header className="topbar">
        <Link href="/" className="brand" aria-label="ACRO/FINDER ホーム">
          <div className="brand-mark">A</div>
          <div>
            ACRO<span style={{ color: "var(--ink-3)" }}>/</span>FINDER
            <div className="jp">アクロバット練習施設</div>
          </div>
        </Link>
        <TopNav active="skills" badges={{ skills: SKILLS.length }} />
        <div className="search">
          <span className="search-icon">⌕</span>
          <input
            type="text"
            aria-label="技を検索"
            placeholder="技名・タグで検索（⌘K）"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="topbar-actions">
          <button
            className={`btn${showFavOnly ? " btn-primary" : ""}`}
            aria-pressed={showFavOnly}
            onClick={() => setShowFavOnly((v) => !v)}
          >
            ★ お気に入り {favs.size}
          </button>
          <button
            className={`btn${showDoneOnly ? " btn-primary" : ""}`}
            aria-pressed={showDoneOnly}
            onClick={() => setShowDoneOnly((v) => !v)}
          >
            ✓ 習得済み {dones.size}
          </button>
        </div>
      </header>

      <nav className="skl-genrebar" aria-label="ジャンル">
        {SKILL_GENRES.map((g) => (
          <button
            key={g.id}
            className={`skl-genre-tab${genre === g.id ? " active" : ""}`}
            aria-pressed={genre === g.id}
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

      <main className="skl-main">
        <h1 className="sr-only">技ガイド</h1>
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
              <p className="skl-empty-hint">
                キーワードを短くするか、ジャンル・難易度・タグの絞り込みを外すと見つかることがあります。
              </p>
              <button className="btn" onClick={clearAll}>
                条件をすべて解除
              </button>
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
          onClose={closeSelected}
          onFav={() => selected && toggleFav(selected.id)}
          onDone={() => selected && toggleDone(selected.id)}
          onAddCombo={() => selected && addToCombo(selected.id)}
          onJump={(id) => setSelectedId(id)}
        />
      </main>

      <ComboDock
        combo={combo}
        byId={byId}
        collapsed={comboCollapsed}
        setCollapsed={setComboCollapsed}
        onRemove={removeFromCombo}
        onClear={clearCombo}
        onUndoClear={clearedCombo ? undoClear : undefined}
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
  const sortId = useId();

  // Arrow keys move a thumb one level; Home/End jump to the ends (SHIG 94).
  const thumbKey = (which: "min" | "max") => (e: ReactKeyboardEvent) => {
    const cur = which === "min" ? lvMin : lvMax;
    let next: number | null = null;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = cur - 1;
    else if (e.key === "ArrowRight" || e.key === "ArrowUp") next = cur + 1;
    else if (e.key === "Home") next = 1;
    else if (e.key === "End") next = 10;
    if (next === null) return;
    e.preventDefault();
    next = Math.max(1, Math.min(10, next));
    if (which === "min") setLvMin(Math.min(next, lvMax));
    else setLvMax(Math.max(next, lvMin));
  };

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
    <section className="skl-filterbar" aria-label="絞り込み">
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
              role="slider"
              tabIndex={0}
              aria-label="難易度の下限"
              aria-valuemin={1}
              aria-valuemax={10}
              aria-valuenow={lvMin}
              aria-valuetext={`Lv.${lvMin}`}
              style={{ left: `${minPct}%` }}
              onMouseDown={() => (dragRef.current = "min")}
              onTouchStart={() => (dragRef.current = "min")}
              onKeyDown={thumbKey("min")}
            />
            <div
              className="skl-lv-thumb"
              role="slider"
              tabIndex={0}
              aria-label="難易度の上限"
              aria-valuemin={1}
              aria-valuemax={10}
              aria-valuenow={lvMax}
              aria-valuetext={`Lv.${lvMax}`}
              style={{ left: `${maxPct}%` }}
              onMouseDown={() => (dragRef.current = "max")}
              onTouchStart={() => (dragRef.current = "max")}
              onKeyDown={thumbKey("max")}
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
              aria-pressed={activeTags.has(tag)}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="skl-fb-group">
        <label className="skl-fb-label" htmlFor={sortId}>
          並び
        </label>
        <select
          id={sortId}
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
        <div className="skl-layout-toggle" role="group" aria-label="表示">
          <button
            className={layout === "grid" ? "active" : ""}
            aria-pressed={layout === "grid"}
            onClick={() => setLayout("grid")}
          >
            ▦ Grid
          </button>
          <button
            className={layout === "list" ? "active" : ""}
            aria-pressed={layout === "list"}
            onClick={() => setLayout("list")}
          >
            ▤ List
          </button>
          <button
            className={layout === "graph" ? "active" : ""}
            aria-pressed={layout === "graph"}
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
    </section>
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
    <div
      className={`skl-card${selected ? " active" : ""}`}
      onClick={onClick}
      aria-current={selected || undefined}
    >
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
          aria-pressed={isFav}
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
          aria-pressed={isDone}
        >
          ✓
        </button>
      </div>
      <div className="skl-card-body">
        <div className="skl-card-nameblock">
          <div className="skl-card-name">
            <button
              type="button"
              className="skl-card-open"
              aria-label={`${skill.name_ja}（Lv.${skill.lv}）の詳細を開く`}
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              {skill.name_ja}
            </button>
          </div>
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
  if (!skill) return <aside className="skl-panel" aria-label="技の詳細" />;

  const genre = SKILL_GENRES.find((g) => g.id === skill.genre);
  const prereqList = skill.prereqs.map((id) => byId[id]).filter(Boolean);
  const leadsList = skill.leads.map((id) => byId[id]).filter(Boolean);

  return (
    <aside className="skl-panel open" aria-label="技の詳細">
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
          <h2 className="skl-sp-name">{skill.name_ja}</h2>
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
            aria-pressed={isFav}
            onClick={onFav}
          >
            {isFav ? "★" : "☆"} お気に入り
          </button>
          <button
            className={`skl-sp-action${isDone ? " active" : ""}`}
            aria-pressed={isDone}
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
  onUndoClear,
}: {
  combo: string[];
  byId: Record<string, Skill>;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  onRemove: (idx: number) => void;
  onClear: () => void;
  /** Present only right after a clear; renders the undo notice. */
  onUndoClear?: () => void;
}) {
  const totalLv = combo.reduce((sum, id) => sum + (byId[id]?.lv || 0), 0);
  // "クリア" disables itself once the combo is empty, which would drop keyboard
  // focus on <body>; move it to the undo button that replaces the slots.
  const undoRef = useRef<HTMLButtonElement>(null);
  const canUndo = !!onUndoClear;
  useEffect(() => {
    if (canUndo) undoRef.current?.focus();
  }, [canUndo]);

  return (
    <section className={`skl-combo${collapsed ? " collapsed" : ""}`} aria-label="コンボビルダー">
      <button
        className="skl-combo-toggle"
        aria-expanded={!collapsed}
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
            {combo.length === 0 && onUndoClear ? (
              <div className="skl-combo-empty skl-combo-undo" role="status">
                コンボをクリアしました
                <button className="btn" onClick={onUndoClear} ref={undoRef}>
                  元に戻す
                </button>
              </div>
            ) : combo.length === 0 ? (
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
                        Lv.{s.lv} · {SKILL_GENRES.find((g) => g.id === s.genre)?.name_ja ?? s.genre}
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
    </section>
  );
}
