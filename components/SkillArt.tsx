import { useSyncExternalStore } from "react";
import type { Skill, SkillGenre } from "@/lib/skills-data";

// プログラム生成のスキルアート。技ごとに固有・決定的なモーション図を描く。
// ジャンルで配色、難易度で回転弧の広がり、技idをシードに構図が決まる。

const GENRE_COLOR: Record<SkillGenre, string> = {
  tricking: "#c6e84a",
  parkour: "#e8a23c",
  gym: "#46cfc6",
  break: "#e072ad",
  ski: "#6298e0",
  snow: "#a886e6",
};
const GENRE_ABBR: Record<SkillGenre, string> = {
  tricking: "TRK",
  parkour: "PKR",
  gym: "GYM",
  break: "BRK",
  ski: "SKI",
  snow: "SNW",
};

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pt = (cx: number, cy: number, r: number, deg: number): [number, number] => [
  cx + r * Math.cos((deg * Math.PI) / 180),
  cy + r * Math.sin((deg * Math.PI) / 180),
];

function arcPath(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const [x0, y0] = pt(cx, cy, r, a0);
  const [x1, y1] = pt(cx, cy, r, a1);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  return `M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
}

// ハイドレーション済みかを effect + setState なしで判定する（カスケード再レンダを避ける）。
// サーバースナップショットは false、クライアントスナップショットは true を返し、値は変化しない。
const subscribeNever = () => () => {};
const onClient = () => true;
const onServer = () => false;

/** SSR 時に描く空の枠。実物と同じ viewBox / class なので占有サイズが一致し、
 *  クライアントで中身が入ってもレイアウトシフトは起きない。 */
function ArtFrame() {
  return (
    <svg
      className="skl-art"
      viewBox="0 0 320 240"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    />
  );
}

export function SkillArt({ skill }: { skill: Skill }) {
  // このアートは aria-hidden の純装飾で、技 id から決定的に再現できる。
  // SSR HTML に含めると 80 技ぶんで約 320KB（/skills の 73%）になり、nonce CSP により
  // 全ルートが CDN キャッシュ不可なため、その全量が毎リクエスト Vercel の
  // Fast Origin Transfer として課金される。描画コードはハッシュ付きの immutable な
  // クライアントチャンクに既に入っており CDN から配信されるので、
  // ハイドレーション後にクライアントで描けば転送量を払わずに同じ絵が出る。
  const hydrated = useSyncExternalStore(subscribeNever, onClient, onServer);

  const rng = mulberry32(hash(skill.id));
  const color = GENRE_COLOR[skill.genre];
  const abbr = GENRE_ABBR[skill.genre];
  const uid = `skart-${skill.id}`;

  if (!hydrated) return <ArtFrame />;

  const cx = 132 + rng() * 56;
  const cy = 96 + rng() * 48;
  const baseR = 50 + rng() * 22;
  const rot = rng() * 360;
  // 回転弧の広がりは難易度に比例（Lv.1 ≈ 96°, Lv.10 ≈ 330°）。
  const sweep = Math.min(330, 70 + skill.lv * 26);
  const dotCount = Math.min(7, Math.max(2, Math.round(skill.lv * 0.7) + 1));
  const wmRot = -18 + rng() * 36;
  const groundY = 196 + rng() * 18;
  const diagShift = rng() * 120;

  const dots = Array.from({ length: dotCount }, (_, i) => {
    const a = rot + (sweep * i) / Math.max(1, dotCount - 1);
    const [x, y] = pt(cx, cy, baseR, a);
    return { x, y, r: i === dotCount - 1 ? 5.2 : 2.6, key: i };
  });
  const [endX, endY] = pt(cx, cy, baseR, rot + sweep);

  return (
    <svg
      className="skl-art"
      viewBox="0 0 320 240"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={uid} cx="50%" cy="42%" r="62%">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="320" height="240" fill={`url(#${uid})`} />

      <text
        x={cx}
        y={cy + 34}
        textAnchor="middle"
        transform={`rotate(${wmRot} ${cx} ${cy})`}
        style={{ fontFamily: "var(--font-en)", fontWeight: 700, fontSize: 104 }}
        fill={color}
        fillOpacity="0.1"
      >
        {abbr}
      </text>

      {/* 軌道（モーションパス） */}
      <path
        d={`M ${20 + diagShift * 0.2} 214 Q ${cx} ${cy - 40} ${300 - diagShift * 0.5} 30`}
        fill="none"
        stroke="#565a4d"
        strokeWidth="1"
        strokeDasharray="3 5"
        strokeOpacity="0.6"
      />

      {/* 地面ライン */}
      <line
        x1="16"
        y1={groundY}
        x2="304"
        y2={groundY}
        stroke="#565a4d"
        strokeWidth="1"
        strokeDasharray="2 6"
        strokeOpacity="0.55"
      />

      {/* 内側の弧 */}
      <path
        d={arcPath(cx, cy, baseR - 13, rot + 26, rot + 26 + sweep * 0.66)}
        fill="none"
        stroke={color}
        strokeWidth="1.4"
        strokeOpacity="0.4"
        strokeLinecap="round"
      />

      {/* メインの回転弧 */}
      <path
        d={arcPath(cx, cy, baseR, rot, rot + sweep)}
        fill="none"
        stroke={color}
        strokeWidth="3.2"
        strokeOpacity="0.92"
        strokeLinecap="round"
      />

      {/* モーションドット */}
      {dots.map((d) => (
        <circle
          key={d.key}
          cx={d.x}
          cy={d.y}
          r={d.r}
          fill={color}
          fillOpacity={d.r > 4 ? 1 : 0.65}
        />
      ))}

      {/* 着地マーカー */}
      <rect
        x={endX - 5}
        y={endY - 5}
        width="10"
        height="10"
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        transform={`rotate(45 ${endX} ${endY})`}
      />
    </svg>
  );
}
