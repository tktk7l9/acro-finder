// 公開URLの唯一の定義。canonical / metadataBase / sitemap / robots / JSON-LD が
// すべてここを参照する。
//
// 2026-09-14 に Vercel から Cloudflare Workers へ移行した。移行前は
// `VERCEL_PROJECT_PRODUCTION_URL` から組み立て、無ければ localhost に落ちていた。
// Workers ではその環境変数が存在しないので、そのままだと **本番の canonical と
// sitemap が http://localhost:3000 になる**（ビルドは通り、ページも正常に見える）。
// 静かに壊れる形なので、env を読むのをやめて定数にしてある。
// site.test.ts が旧Vercelドメインへの差し戻しと末尾スラッシュを止める。
export const SITE_URL = "https://acro-finder.saitotakuya0719.workers.dev";

export const SITE_NAME = "ACRO/FINDER";
