// Content-Security-Policy の正本。next.config.ts の headers() がこれを配る。
//
// 以前は proxy.ts が per-request で nonce 付きの CSP を発行していたが、Next 16 の
// proxy は Node ランタイム専用で、OpenNext (Cloudflare Workers) は Node middleware に
// 対応していないため移行できなかった。nonce をやめて静的ヘッダーに移した。
//
// script-src に 'unsafe-inline' が要るのは Next の bootstrap（self.__next_f.push）が
// インラインだから。ld+json はデータブロックで実行されないため script-src の対象外。
// img-src の blob: / https: は地図タイルと施設写真、worker-src の blob: は地図
// ライブラリが起こす Worker のため。
//
// Cloudflare Web Analytics のビーコンで2箇所広げている。スクリプト本体は
// static.cloudflareinsights.com から読み込まれ、計測データは
// cloudflareinsights.com へ POST される。**片方でも欠けるとページは正常に
// 見えたままビーコンだけ黙ってブロックされる**ので、csp.test.ts で両方を固定した。
export function contentSecurityPolicy({ dev = false }: { dev?: boolean } = {}): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://cloudflareinsights.com",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}
