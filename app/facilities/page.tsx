import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { FACILITIES } from "@/lib/data";
import { facilitiesByPrefecture } from "@/lib/areas";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/jsonld";
import { SITE_URL } from "@/lib/site";
import { SiteHeader } from "@/components/SiteHeader";
import { Breadcrumb, type Crumb } from "@/components/Breadcrumb";
import { FacilityLink } from "@/components/FacilityLink";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "アクロバット練習施設の一覧（全国）",
  description:
    "全国のトリッキング・パルクール・アクロバット練習施設を都道府県別に一覧。料金・設備・レッスン・予約情報つきで近くの施設を探せます。",
  alternates: { canonical: "/facilities" },
};

export default async function FacilitiesIndexPage() {
  const groups = facilitiesByPrefecture();
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const crumbs: Crumb[] = [
    { name: "ホーム", href: "/" },
    { name: "施設一覧", href: "/facilities" },
  ];

  return (
    <div className="doc-shell">
      <SiteHeader active="facilities" />
      <main className="doc">
        <Breadcrumb items={crumbs} />
        <h1>アクロバット練習施設 一覧</h1>
        <p className="doc-sub">
          全 {FACILITIES.length} 施設 · {groups.length} 都道府県
        </p>
        <p className="doc-lede">
          トリッキング・パルクール・アクロバット（体操・宙返り）を練習できる全国の施設を都道府県別に
          まとめました。各施設ページで料金・設備・レッスン・予約方法・アクセスを確認できます。
        </p>
        {groups.map((g) => (
          <section key={g.slug} className="area-section">
            <div className="area-section-head">
              <h2>
                {g.prefecture.name}
                <span className="count">（{g.facilities.length}）</span>
              </h2>
              <Link href={`/area/${g.slug}`}>このエリアを見る →</Link>
            </div>
            <div className="area-grid">
              {g.facilities.map((f) => (
                <FacilityLink key={f.id} facility={f} />
              ))}
            </div>
          </section>
        ))}

        <section className="detail-section" style={{ marginTop: 8 }}>
          <h2 className="detail-section-title">施設運営者の方へ</h2>
          <p className="doc-lede" style={{ margin: "0 0 14px" }}>
            あなたの施設を掲載しませんか？無料掲載・PR掲載・予約管理ツールをご案内しています。
          </p>
          <Link href="/owners" className="btn btn-primary">
            掲載・PRのご案内 →
          </Link>
        </section>
      </main>

      <JsonLd
        nonce={nonce}
        data={[
          breadcrumbJsonLd(crumbs.map((c) => ({ name: c.name, url: `${SITE_URL}${c.href}` }))),
          itemListJsonLd(
            FACILITIES.map((f) => ({ name: f.name, url: `${SITE_URL}/facilities/${f.id}` })),
          ),
        ]}
      />
    </div>
  );
}
