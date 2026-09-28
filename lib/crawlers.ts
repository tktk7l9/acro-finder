/** Crawlers that collect training data or build AI summaries.
 *
 *  On 2026-09-12 we dropped the nonce CSP and most routes became CDN-cacheable.
 *  However, area/[pref] and facilities/[id] have no generateStaticParams and stay dynamic,
 *  so each crawl request there still costs the full page's bytes in transfer.
 *  With 127 URLs in the sitemap,
 *  letting aggressive AI crawlers through would use up the 10GB free tier quickly.
 *
 *  Search traffic is the lifeline of the business, so Googlebot / Bingbot are allowed.
 *  Google-Extended only controls use for Gemini training and does not affect the search index. */
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
