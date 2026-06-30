import type { PhotoColor } from "./types";
import { todayJst, addDaysIso } from "./util";

export type EventType = "comp" | "jam" | "ws" | "shoot";
export type EventStatus = "open" | "soon" | "full" | "closed" | "past";

// 実在のパルクール/トリッキング大会・イベント。
// 出典: PTvillage 大会・イベントアーカイブ (https://pt-village.com/event/)。
// 大会は公共会場で開催され特定の練習施設に紐づかないため facilityId は持たず、
// 会場は venue に記録する。定員・参加費等は非公開のため任意項目。
export interface AcroEvent {
  id: string;
  title: string;
  titleJa: string;
  type: EventType;
  typeLabel: string;
  date: string;
  /** Manual override (e.g. "full"/"closed"). When absent, status is derived
   *  from the date so the feed never goes stale — see `eventStatus`. */
  status?: EventStatus;
  featured: boolean;
  cover: PhotoColor;
  description: string;
  /** 開催会場（市区町村・会場名）。 */
  venue?: string;
  /** 関連する施設ID（施設主催の場合のみ）。 */
  facilityId?: string;
  endDate?: string;
  time?: string;
  capacity?: number;
  entered?: number;
  fee?: string;
  feeNote?: string;
  tags?: string[];
  headliners?: string[];
  deadline?: string;
}

export const EVENTS: AcroEvent[] = [
  {
    id: "e01",
    title: "Overheat Gathering 2026",
    titleJa: "オーバーヒート・ギャザリング 2026",
    type: "jam",
    typeLabel: "ジャム",
    date: "2026-05-02",
    featured: false,
    cover: "ok-lime",
    description: "トリッキングコミュニティが集うギャザリングイベント。",
    tags: ["トリッキング", "コミュニティ"],
  },
  {
    id: "e02",
    title: "PHOENIX GAMEZ -BEYOND THE LIMITS-",
    titleJa: "フェニックスゲームズ -BEYOND THE LIMITS-",
    type: "comp",
    typeLabel: "大会",
    date: "2026-05-03",
    featured: false,
    cover: "ok-amber",
    description: "パルクール・フリースタイルの実力を競う大会。",
    tags: ["パルクール", "フリースタイル"],
  },
  {
    id: "e03",
    title: "ぱるフェス2026",
    titleJa: "ぱるフェス2026",
    type: "jam",
    typeLabel: "ジャム",
    date: "2026-04-29",
    featured: false,
    cover: "ok-slate",
    description: "パルクールを楽しむ参加型の祭典イベント。",
    tags: ["パルクール", "フェス"],
  },
  {
    id: "e04",
    title: "第7回パルクール日本選手権予選 ＆ ネクストジェン選考会予選",
    titleJa: "第7回パルクール日本選手権予選 ＆ ネクストジェン選考会予選",
    type: "comp",
    typeLabel: "大会",
    date: "2026-04-17",
    endDate: "2026-04-19",
    featured: false,
    cover: "ok-lime",
    venue: "広島ゲートパーク（URBAN FUTURES HIROSHIMA 2026）",
    description:
      "日本体操協会が主催するパルクール日本選手権・第7回大会の予選と、ネクストジェン選考会の予選。",
    tags: ["日本選手権", "予選", "公式大会"],
  },
  {
    id: "e05",
    title: "JPL SEASON 1 – STAGE 1",
    titleJa: "JPL シーズン1 ステージ1",
    type: "comp",
    typeLabel: "大会",
    date: "2026-03-29",
    featured: false,
    cover: "ok-amber",
    description: "Japan Parkour League のリーグ戦・第1ステージ。",
    tags: ["パルクール", "リーグ戦"],
  },
  {
    id: "e06",
    title: "PARKOUR NINJA COMPETITION 2026",
    titleJa: "パルクール ニンジャ コンペティション 2026",
    type: "comp",
    typeLabel: "大会",
    date: "2026-03-28",
    featured: false,
    cover: "ok-slate",
    venue: "ニンジャ☆パーク",
    description: "全国に展開するニンジャ☆パークが主催するパルクール大会。",
    tags: ["パルクール", "全国規模"],
  },
  {
    id: "e07",
    title: "Reunion Jam 2026",
    titleJa: "リユニオン・ジャム 2026",
    type: "jam",
    typeLabel: "ジャム",
    date: "2026-03-20",
    featured: false,
    cover: "ok-lime",
    venue: "兵庫県加東市",
    description: "2泊3日で行われるパルクールジャム。全国のトレーサーが集う。",
    tags: ["パルクール", "ジャム", "合宿型"],
  },
  {
    id: "e08",
    title: "TOKIOインカラミ presents PARKOUR PREMIER CUP 2026 NewYear Special in 札幌",
    titleJa: "パルクール プレミアカップ 2026 ニューイヤースペシャル in 札幌",
    type: "comp",
    typeLabel: "大会",
    date: "2026-01-07",
    featured: false,
    cover: "ok-amber",
    venue: "札幌",
    description: "札幌で開催された新春のパルクール大会。",
    tags: ["パルクール", "北海道"],
  },
  {
    id: "e09",
    title: "FINAL MISSION 2025",
    titleJa: "ファイナルミッション 2025",
    type: "comp",
    typeLabel: "大会",
    date: "2025-12-26",
    featured: false,
    cover: "ok-slate",
    description: "年末恒例のパルクール・フリースタイル大会。",
    tags: ["パルクール", "年末"],
  },
  {
    id: "e10",
    title: "YUSF 2025 OFB2025 YOKOHAMA -1on1-",
    titleJa: "YUSF 2025 横浜 -1on1-",
    type: "comp",
    typeLabel: "大会",
    date: "2025-11-16",
    featured: false,
    cover: "ok-lime",
    venue: "横浜",
    description: "横浜で開催された1on1形式のフリースタイルバトル。",
    tags: ["フリースタイル", "1on1", "横浜"],
  },
  {
    id: "e11",
    title: "TSFes 2025 OFB2025 IKEBUKURO -1on1-",
    titleJa: "TSFes 2025 池袋 -1on1-",
    type: "comp",
    typeLabel: "大会",
    date: "2025-11-03",
    featured: false,
    cover: "ok-amber",
    venue: "池袋",
    description: "池袋で開催された1on1形式のフリースタイルバトル。",
    tags: ["フリースタイル", "1on1", "池袋"],
  },
  {
    id: "e12",
    title: "PARKOUR TOP OF JAPAN YOKOSUKA 2025",
    titleJa: "パルクール トップ・オブ・ジャパン 横須賀 2025",
    type: "comp",
    typeLabel: "大会",
    date: "2025-10-25",
    featured: false,
    cover: "ok-slate",
    venue: "横須賀",
    description: "横須賀で開催される、全国トップ選手によるパルクール大会。",
    tags: ["パルクール", "トップ選手", "横須賀"],
  },
  {
    id: "e13",
    title: "All Japan XTC 2026",
    titleJa: "オールジャパン XTC 2026（XMA・トリッキング選手権）",
    type: "comp",
    typeLabel: "大会",
    date: "2026-08-30",
    featured: true,
    cover: "ok-amber",
    venue: "国士舘大学 多摩キャンパス",
    description:
      "XMA（エクストリームマーシャルアーツ）とトリッキングの全日本選手権。2012年から毎年開催される国内最大級の総合大会。",
    time: "開場 10:00 / XMA 10:30〜 ・ トリッキングバトル 14:00〜17:30",
    tags: ["トリッキング", "XMA", "全日本"],
  },
];

export const EVENT_TYPES: { key: "all" | EventType; label: string; color: string }[] = [
  { key: "all", label: "すべて", color: "var(--ink)" },
  { key: "comp", label: "大会", color: "oklch(0.7 0.2 25)" },
  { key: "jam", label: "ジャム", color: "var(--accent)" },
  { key: "ws", label: "ワークショップ", color: "oklch(0.7 0.18 240)" },
  { key: "shoot", label: "撮影会", color: "oklch(0.78 0.16 80)" },
];

export const EVENT_STATUS: Record<EventStatus, { label: string; class: string }> = {
  open: { label: "募集中", class: "st-open" },
  soon: { label: "締切間近", class: "st-soon" },
  full: { label: "満員", class: "st-full" },
  closed: { label: "受付終了", class: "st-closed" },
  past: { label: "開催済み", class: "st-past" },
};

// Effective status for an event. An explicit `status` (e.g. a manually set
// "full"/"closed") wins; otherwise it is derived from the date so the feed
// stays correct over time instead of being permanently "past".
export function eventStatus(e: AcroEvent, today: string = todayJst()): EventStatus {
  if (e.status) return e.status;
  const end = e.endDate ?? e.date;
  if (end < today) return "past";
  if (e.date <= addDaysIso(today, 14)) return "soon";
  return "open";
}
