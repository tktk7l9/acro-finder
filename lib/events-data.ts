import type { PhotoColor } from "./types";
import { todayJst, addDaysIso } from "./util";

export type EventType = "comp" | "jam" | "ws" | "shoot";
export type EventStatus = "open" | "soon" | "full" | "closed" | "past";

// Real parkour / tricking competitions and events.
// Source: PTvillage competition and event archive (https://pt-village.com/event/).
// Competitions are held at public venues and are not tied to a practice facility, so they have
// no facilityId and the venue is stored in venue. Capacity, fees, etc. are not public, so they are optional.
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
  /** Venue (municipality and venue name). */
  venue?: string;
  /** Related facility ID (only when hosted by a facility). */
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
    endDate: "2026-05-03",
    featured: false,
    cover: "ok-lime",
    venue: "羽衣体操クラブ（大阪）",
    description:
      "トリッキングコミュニティが集う国内最大級のギャザリング。1on1のオープン・U22・U14バトルとセッションの2日間。",
    fee: "バトル ¥5,000 / ギャザリングのみ ¥3,000 / 観覧 ¥1,000",
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
    featured: false,
    cover: "ok-amber",
    venue: "国士舘大学 多摩キャンパス",
    description:
      "XMA（エクストリームマーシャルアーツ）とトリッキングの全日本選手権。2012年から毎年開催される国内最大級の総合大会。",
    time: "開場 10:00 / XMA 10:30〜 ・ トリッキングバトル 14:00〜17:30",
    tags: ["トリッキング", "XMA", "全日本"],
  },
  // Added 2026-10-06 from the PTvillage archive and each organiser's official page.
  {
    id: "e14",
    title: "SteeZoo Gathering 2026",
    titleJa: "スティーズー・ギャザリング 2026",
    type: "jam",
    typeLabel: "ジャム",
    date: "2026-05-30",
    endDate: "2026-05-31",
    featured: false,
    cover: "ok-slate",
    venue: "HERO STUDIO 磯子店（横浜市磯子区）",
    description:
      "1on1トリッキングバトルを中心に、セッション・ワークショップ・撮影会・アフターパーティーまで詰め込んだ2日間のギャザリング。",
    fee: "2日通し ¥6,000 / 1日 ¥3,000〜4,000 / ナイトショー観覧 ¥2,000",
    tags: ["トリッキング", "1on1", "横浜"],
  },
  {
    id: "e15",
    title: "JAPAN PARKOUR HERO'S Jr. 2026",
    titleJa: "ジャパン パルクール ヒーローズ ジュニア 2026",
    type: "comp",
    typeLabel: "大会",
    date: "2026-05-31",
    featured: false,
    cover: "ok-lime",
    venue: "刈谷市総合運動公園（KARIYA URBAN FES. 2026）",
    description:
      "15歳以下を対象にしたパルクールのフリースタイルバトル。刈谷のアーバンスポーツフェスの一企画として開催。",
    fee: "入場無料",
    tags: ["パルクール", "ジュニア", "愛知"],
  },
  {
    id: "e16",
    title: "パルクールの日 2026 関東合同JAM",
    titleJa: "パルクールの日 2026 関東合同JAM ＆ 全国連携イベント",
    type: "jam",
    typeLabel: "ジャム",
    date: "2026-08-09",
    featured: false,
    cover: "ok-amber",
    venue: "宮下パーク（東京都渋谷区）ほか全国の提携施設",
    description:
      "8月9日「パルクールの日」に合わせ、日本パルクール協会と全国の施設が連携して開く練習会。初心者向けの体験枠もあり、事前申込不要。",
    fee: "参加無料",
    tags: ["パルクール", "ジャム", "初心者歓迎"],
  },
  {
    id: "e17",
    title: "第7回パルクール日本選手権決勝 ／ ネクストジェン選考会決勝",
    titleJa: "第7回パルクール日本選手権決勝 ／ 第7回パルクールネクストジェン選考会決勝",
    type: "comp",
    typeLabel: "大会",
    date: "2026-09-05",
    endDate: "2026-09-06",
    featured: false,
    cover: "ok-slate",
    venue: "COCOLAND体育館（山口県宇部市）",
    description:
      "日本体操協会が主催するパルクール日本選手権の決勝大会。フリースタイルとスピードの2種目で日本一を決める。",
    tags: ["日本選手権", "公式大会", "山口"],
  },
  {
    id: "e18",
    title: "YOKOHAMA URBAN SPORTS FESTIVAL '26（OFB）",
    titleJa: "横浜アーバンスポーツフェスティバル '26 パルクール OFB",
    type: "comp",
    typeLabel: "大会",
    date: "2026-10-17",
    endDate: "2026-10-18",
    featured: false,
    cover: "ok-lime",
    venue: "横浜赤レンガ倉庫イベント広場・赤レンガパーク（横浜市中区新港1-1）",
    description:
      "横浜赤レンガで開かれるアーバンスポーツの祭典。パルクールはトーナメント形式のバトル「OFB（One Flow Battle）」を実施。",
    time: "11:00〜20:00（競技時間は後日発表）",
    fee: "入場無料",
    tags: ["パルクール", "フリースタイル", "横浜"],
  },
  {
    id: "e19",
    title: "JPL SEASON 1 – 第2戦",
    titleJa: "JPL シーズン1 第2戦（MAX ATTACK岡崎）",
    type: "comp",
    typeLabel: "大会",
    date: "2026-10-24",
    featured: false,
    cover: "ok-amber",
    venue: "パルクールパーク MAX ATTACK 岡崎（愛知県岡崎市）",
    description:
      "スピード・スキル・フリースタイルの3種目を3対3で争う Japan Parkour League の第2戦。屋内施設で照明演出つきの開催。",
    tags: ["パルクール", "リーグ戦", "愛知"],
  },
  {
    id: "e20",
    title: "Tricking Battle of Q-shu 2026",
    titleJa: "トリッキング バトル オブ 九州 2026",
    type: "comp",
    typeLabel: "大会",
    date: "2026-10-30",
    endDate: "2026-11-01",
    featured: true,
    cover: "ok-slate",
    venue: "Do Challenge Club 小山店（熊本市東区小山2-13-15）",
    facilityId: "f95",
    description:
      "日本トリッキング協会が主催する3日間のトリッキング大会。U-12バトルとオープンバトルに加え、ギャザリング・ワークショップ・ナイトパーティーも開催。",
    fee: "バトル ¥3,000 / ワークショップ ¥3,000 / ギャザリング ¥1,000（1日） / 観覧 ¥1,000（1日）",
    feeNote: "会場では現金のみ",
    deadline: "2026-10-24",
    tags: ["トリッキング", "1on1", "熊本"],
  },
  {
    id: "e21",
    title: "PARKOUR TOP OF JAPAN YOKOSUKA 2026",
    titleJa: "パルクール トップ・オブ・ジャパン 横須賀 2026",
    type: "comp",
    typeLabel: "大会",
    date: "2026-11-08",
    featured: false,
    cover: "ok-lime",
    venue: "ヴェルニー公園 いこいの広場（神奈川県横須賀市）",
    description:
      "東京都体操協会パルクール委員会が主催する屋外大会。フリースタイルとスピードランを男女別に実施し、ライブパフォーマンスも併催。",
    time: "11:00〜17:00",
    fee: "観覧無料",
    tags: ["パルクール", "トップ選手", "横須賀"],
  },
  {
    id: "e22",
    title: "JPL トーナメント 2026",
    titleJa: "JPL トーナメント 2026（四日市）",
    type: "comp",
    typeLabel: "大会",
    date: "2026-12-05",
    endDate: "2026-12-06",
    featured: false,
    cover: "ok-amber",
    venue: "四日市市民公園（三重県四日市市）",
    description: "Japan Parkour League のトーナメント戦。リーグ所属チーム以外も参加できる一般参加枠がある。",
    tags: ["パルクール", "リーグ戦", "三重"],
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
