import { SKILL_GENRES, type Skill, type SkillGenre } from "@/lib/skills-data";

// 技の相関図（アイソメトリック3D）。
//   難易度(Lv)     … 横の地面軸（右下方向）
//   類似クラスタ   … 奥行きの地面軸（左下方向）。タグの共通性でまとめるため、
//                    ジャンルが違っても似た技は同じレーンに近接する。
//   派生段階       … 高さ軸（同一セルの技を上へ積む）
// ジャンルはノードの色で表す。

const GENRE_COLOR: Record<SkillGenre, string> = {
  tricking: "#c6e84a",
  parkour: "#e8a23c",
  gym: "#46cfc6",
  break: "#e072ad",
  ski: "#6298e0",
  snow: "#a886e6",
};
const GENRE_NAME: Record<string, string> = Object.fromEntries(
  SKILL_GENRES.map((g) => [g.id, g.name_ja]),
);
const GENRE_LEGEND = SKILL_GENRES.filter((g) => g.id !== "all").map(
  (g) => g.id as SkillGenre,
);

// 似た技クラスタ。上から順に判定し、最初にタグが一致したクラスタへ割り当てる。
const CLUSTERS: { name: string; tags: string[] }[] = [
  { name: "フリップ系", tags: ["flip", "tumbling", "double"] },
  { name: "キック系", tags: ["kick", "sweep"] },
  { name: "グラブ系", tags: ["grab"] },
  { name: "ボルト系", tags: ["vault"] },
  { name: "ウォール・クライム系", tags: ["wall", "climb"] },
  { name: "パワー・フリーズ系", tags: ["power", "freeze", "static", "strength"] },
  { name: "スピン系", tags: ["spin"] },
  { name: "基礎・移動系", tags: [] }, // 受け皿
];

function clusterOf(skill: Skill): number {
  for (let i = 0; i < CLUSTERS.length - 1; i++) {
    if (skill.tags.some((t) => CLUSTERS[i].tags.includes(t))) return i;
  }
  return CLUSTERS.length - 1;
}

const LV_DX = 134;
const LV_DY = 18;
const CL_DX = -82;
const CL_DY = 206;
const STACK_DY = 44;
const NODE_W = 124;
const NODE_H = 34;
const PAD = 36;
const MARGIN_L = 150;
const MARGIN_T = 44;

function trunc(s: string): string {
  return s.length > 8 ? s.slice(0, 7) + "…" : s;
}

export function SkillGraph({
  skills,
  selectedId,
  onSelect,
}: {
  skills: Skill[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (skills.length === 0) {
    return (
      <div className="skl-empty">
        <div className="skl-empty-glyph">∅</div>
        <div className="skl-empty-text">該当する技が見つかりません</div>
      </div>
    );
  }

  const clusterIdx = new Map(skills.map((s) => [s.id, clusterOf(s)]));
  const present = CLUSTERS.map((_, i) => i).filter((i) =>
    skills.some((s) => clusterIdx.get(s.id) === i),
  );
  const cPos = new Map(present.map((c, i) => [c, i]));
  const levels = [...new Set(skills.map((s) => s.lv))].sort((a, b) => a - b);
  const liOf = new Map(levels.map((lv, i) => [lv, i]));

  // 同一クラスタ・同一Lvの技を積み上げ順に並べる（ジャンルでまとめる）。
  const cell = new Map<string, Skill[]>();
  for (const s of skills) {
    const k = `${clusterIdx.get(s.id)}|${s.lv}`;
    if (!cell.has(k)) cell.set(k, []);
    cell.get(k)!.push(s);
  }
  for (const arr of cell.values()) {
    arr.sort((a, b) => a.genre.localeCompare(b.genre) || a.name_ja.localeCompare(b.name_ja));
  }

  const raw = new Map<string, { x: number; y: number; ci: number; si: number }>();
  for (const s of skills) {
    const ci = cPos.get(clusterIdx.get(s.id)!)!;
    const li = liOf.get(s.lv)!;
    const si = cell.get(`${clusterIdx.get(s.id)}|${s.lv}`)!.indexOf(s);
    raw.set(s.id, {
      x: li * LV_DX + ci * CL_DX,
      y: li * LV_DY + ci * CL_DY - si * STACK_DY,
      ci,
      si,
    });
  }

  const xs = [...raw.values()].map((p) => p.x);
  const ys = [...raw.values()].map((p) => p.y);
  const offX = MARGIN_L - Math.min(...xs);
  const offY = MARGIN_T - Math.min(...ys);
  const width = Math.max(...xs) - Math.min(...xs) + NODE_W + MARGIN_L + PAD;
  const height = Math.max(...ys) - Math.min(...ys) + NODE_H + MARGIN_T + PAD + 28;

  const pos = new Map(
    [...raw.entries()].map(([id, p]) => [id, { ...p, x: p.x + offX, y: p.y + offY }]),
  );
  const center = (id: string) => {
    const p = pos.get(id)!;
    return { cx: p.x + NODE_W / 2, cy: p.y + NODE_H / 2 };
  };

  const maxLi = levels.length - 1;
  const edges: { from: string; to: string }[] = [];
  for (const s of skills) {
    for (const pid of s.prereqs) {
      if (pos.has(pid)) edges.push({ from: pid, to: s.id });
    }
  }

  const drawOrder = [...skills].sort((a, b) => {
    const pa = raw.get(a.id)!;
    const pb = raw.get(b.id)!;
    return pa.ci - pb.ci || pa.si - pb.si;
  });

  return (
    <svg
      className="skl-graph"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
    >
      {/* 類似クラスタ・レーン（奥行き地面軸） */}
      {present.map((c, ci) => {
        const x0 = offX + ci * CL_DX;
        const y0 = offY + ci * CL_DY;
        const x1 = x0 + maxLi * LV_DX;
        const y1 = y0 + maxLi * LV_DY;
        return (
          <g key={`lane${c}`}>
            <line
              className="skl-graph-lane"
              x1={x0 - 8}
              y1={y0 + NODE_H / 2}
              x2={x1 + NODE_W + 8}
              y2={y1 + NODE_H / 2}
            />
            <text
              className="skl-graph-cluster"
              x={x0 - 12}
              y={y0 + NODE_H / 2}
              textAnchor="end"
              dominantBaseline="middle"
            >
              {CLUSTERS[c].name}
            </text>
          </g>
        );
      })}

      {/* 難易度ラベル（横の地面軸） */}
      {levels.map((lv, li) => (
        <text
          key={`lv${lv}`}
          className="skl-graph-lvhead"
          x={offX + li * LV_DX + NODE_W / 2}
          y={offY + li * LV_DY - 16}
          textAnchor="middle"
        >
          Lv.{lv}
        </text>
      ))}

      {/* 辺（前提技 → 派生技） */}
      {edges.map((e, i) => {
        const a = center(e.from);
        const b = center(e.to);
        const active = e.from === selectedId || e.to === selectedId;
        return (
          <line
            key={i}
            className={`skl-graph-edge${active ? " active" : ""}`}
            x1={a.cx}
            y1={a.cy}
            x2={b.cx}
            y2={b.cy}
          />
        );
      })}

      {/* ノード（色＝ジャンル） */}
      {drawOrder.map((s) => {
        const p = pos.get(s.id)!;
        const color = GENRE_COLOR[s.genre];
        return (
          <g
            key={s.id}
            className={`skl-graph-node${s.id === selectedId ? " sel" : ""}`}
            transform={`translate(${p.x} ${p.y})`}
            onClick={() => onSelect(s.id)}
          >
            <rect width={NODE_W} height={NODE_H} rx={6} />
            <rect width={4} height={NODE_H} rx={2} fill={color} />
            <text className="skl-graph-name" x={13} y={NODE_H / 2 + 1} dominantBaseline="middle">
              {trunc(s.name_ja)}
            </text>
            <text
              className="skl-graph-lv"
              x={NODE_W - 10}
              y={NODE_H / 2 + 1}
              dominantBaseline="middle"
              textAnchor="end"
              fill={color}
            >
              {s.lv}
            </text>
          </g>
        );
      })}

      {/* 3軸の凡例 */}
      <text className="skl-graph-axis" x={14} y={height - 62}>
        難易度 →
      </text>
      <text className="skl-graph-axis" x={14} y={height - 48}>
        似た技クラスタ ↘
      </text>
      <text className="skl-graph-axis" x={14} y={height - 34}>
        派生段階 ↑
      </text>

      {/* ジャンル凡例（ノード色） */}
      {GENRE_LEGEND.map((g, i) => (
        <g key={`leg${g}`} transform={`translate(${14 + i * 96} ${height - 14})`}>
          <rect width={9} height={9} rx={2} y={-8} fill={GENRE_COLOR[g]} />
          <text className="skl-graph-axis" x={14}>
            {GENRE_NAME[g]}
          </text>
        </g>
      ))}
    </svg>
  );
}
