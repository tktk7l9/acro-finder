/** 学習データ収集・AI要約目的のクローラー。
 *
 *  2026-09-12 に nonce CSP をやめ、大半のルートは CDN キャッシュに乗るようになった。
 *  ただし area/[pref] と facilities/[id] は generateStaticParams が無く動的のままで、
 *  そこへの巡回は今も 1 リクエスト = ページ全体のバイト数がそのまま転送量になる。
 *  sitemap に 127 URL あるため、
 *  巡回の激しい AI クローラーを素通しにすると無料枠 10GB を短期間で使い切る。
 *
 *  検索流入は事業上の生命線なので Googlebot / Bingbot は通す。
 *  Google-Extended は Gemini の学習利用のみを制御し、検索インデックスには影響しない。 */
export const DISALLOWED_AI_CRAWLERS = [
  "AI2Bot",
  "Amazonbot",
  "anthropic-ai",
  "Applebot-Extended",
  "Bytespider",
  "CCBot",
  "ChatGPT-User",
  "Claude-Web",
  "ClaudeBot",
  "cohere-ai",
  "Diffbot",
  "FacebookBot",
  "Google-Extended",
  "GPTBot",
  "ImagesiftBot",
  "Meta-ExternalAgent",
  "meta-externalagent",
  "OAI-SearchBot",
  "omgili",
  "PerplexityBot",
  "Perplexity-User",
  "Timpibot",
  "YouBot",
] as const;
