// Monochrome platform logos — fill/stroke via currentColor so the
// .card-sns hover (ink-2 → accent) keeps working.
//
// 施設カードごとに同じロゴを描くため、トップでは 143 個の <svg> が出る。
// パス定義を全文インライン展開すると約 58KB になり、その 96% が重複だった。
// nonce CSP により全ルートが CDN キャッシュ不可＝毎リクエストが Vercel の
// Fast Origin Transfer として課金されるので、<symbol> を一度だけ置いて
// 各所は <use> で参照する（1 箇所あたり約 580B → 約 70B）。

type IconProps = { size?: number };

const SPRITE_ID = {
  web: "sns-web",
  instagram: "sns-instagram",
  x: "sns-x",
  youtube: "sns-youtube",
  tiktok: "sns-tiktok",
} as const;

/** 全アイコンの実体。レイアウトで一度だけ描画する。 */
export function SnsIconSprite() {
  return (
    <svg
      width="0"
      height="0"
      aria-hidden="true"
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
    >
      <defs>
        <symbol id={SPRITE_ID.web} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9.5" />
          <path d="M2.5 12h19" />
          <path d="M12 2.5c2.8 2.6 4.4 6 4.4 9.5S14.8 18.9 12 21.5C9.2 18.9 7.6 15.5 7.6 12S9.2 5.1 12 2.5z" />
        </symbol>

        <symbol id={SPRITE_ID.instagram} viewBox="0 0 24 24">
          <path d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16zm0 4.68A5.16 5.16 0 1 0 12 17.16 5.16 5.16 0 0 0 12 6.84zm0 8.51A3.35 3.35 0 1 1 12 8.65a3.35 3.35 0 0 1 0 6.7zm5.34-9.87a1.2 1.2 0 1 0 0 2.41 1.2 1.2 0 0 0 0-2.41z" />
        </symbol>

        <symbol id={SPRITE_ID.x} viewBox="0 0 24 24">
          <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.59l5.24 6.93zm-1.29 19.5h2.04L6.49 3.24H4.3z" />
        </symbol>

        <symbol id={SPRITE_ID.youtube} viewBox="0 0 24 24">
          <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.55 15.57V8.43L15.82 12z" />
        </symbol>

        <symbol id={SPRITE_ID.tiktok} viewBox="0 0 24 24">
          <path d="M12.53.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
        </symbol>
      </defs>
    </svg>
  );
}

export function WebIcon({ size = 13 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <use href={`#${SPRITE_ID.web}`} />
    </svg>
  );
}

export function InstagramIcon({ size = 13 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <use href={`#${SPRITE_ID.instagram}`} />
    </svg>
  );
}

export function XIcon({ size = 12 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <use href={`#${SPRITE_ID.x}`} />
    </svg>
  );
}

export function YoutubeIcon({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <use href={`#${SPRITE_ID.youtube}`} />
    </svg>
  );
}

export function TiktokIcon({ size = 12 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <use href={`#${SPRITE_ID.tiktok}`} />
    </svg>
  );
}
