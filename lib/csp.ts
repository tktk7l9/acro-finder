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
export function contentSecurityPolicy({ dev = false }: { dev?: boolean } = {}): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    "img-src 'self' data: blob: https:",
    "connect-src 'self'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}
