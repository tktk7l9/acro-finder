import type { Metadata } from "next";
import { headers } from "next/headers";
import { FACILITIES } from "@/lib/data";
import { facilitiesByPrefecture } from "@/lib/areas";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { SITE_URL } from "@/lib/site";
import { SiteHeader } from "@/components/SiteHeader";
import { Breadcrumb, type Crumb } from "@/components/Breadcrumb";
import { JsonLd } from "@/components/JsonLd";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "施設運営者の方へ — 掲載・PR・予約管理のご案内",
  description:
    "トリッキング・パルクール・アクロバット施設の運営者向け。ACRO/FINDER への無料掲載、PR掲載（特集枠）、予約・月謝管理ツールのご案内。全国の練習場所を探すユーザーに施設を届けます。",
  alternates: { canonical: "/owners" },
};

const TIERS = [
  {
    badge: "無料",
    badgeClass: "free",
    title: "無料掲載",
    body: "施設の基本情報（所在地・設備・レッスン・予約方法など）を無料で掲載できます。情報の修正・追加もいつでも無料。まずはここから。",
    cta: "掲載・修正を依頼する",
  },
  {
    badge: "PR",
    badgeClass: "pr",
    title: "PR掲載（特集枠）",
    body: "エリアページや施設一覧での優先表示と PR バッジで、集客を強化します。料金はお問い合わせください。",
    cta: "PR掲載を相談する",
  },
  {
    badge: "準備中",
    badgeClass: "soon",
    title: "予約・月謝管理ツール",
    body: "予約受付・会員管理・月謝集金をまとめて行えるツールを開発中です。先行案内をご希望の方はご連絡ください。",
    cta: "先行案内を希望する",
  },
];

const VALUES = [
  {
    h: "アクロバット特化",
    p: "トリッキング・パルクール・体操に絞った専門サービス。目的の合うユーザーが集まります。",
  },
  {
    h: "地域検索に強い",
    p: "「地名 × トリッキング / パルクール」での検索流入を想定。施設ごとの個別ページと都道府県別ページを用意しています。",
  },
  {
    h: "無料で始められる",
    p: "まずは無料掲載から。掲載のために費用は一切かかりません。",
  },
];

export default async function OwnersPage() {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const prefCount = facilitiesByPrefecture().length;
  const crumbs: Crumb[] = [
    { name: "ホーム", href: "/" },
    { name: "施設運営者の方へ", href: "/owners" },
  ];

  return (
    <div className="doc-shell">
      <SiteHeader />
      <main className="doc">
        <Breadcrumb items={crumbs} />
        <p className="doc-eyebrow">FOR FACILITY OWNERS · 施設運営者の方へ</p>
        <h1>あなたの施設を、探している人に届ける。</h1>
        <p className="doc-lede">
          ACRO/FINDER は、トリッキング・パルクール・アクロバットの練習施設に特化した検索サービスです。
          現在 <strong>{FACILITIES.length}施設・{prefCount}都道府県</strong>{" "}
          を掲載中。全国で練習場所を探すユーザーに、あなたの施設を見つけてもらえます。
        </p>

        <div className="owner-tiers">
          {TIERS.map((t) => (
            <div key={t.title} className="owner-tier">
              <span className={`owner-badge ${t.badgeClass}`}>{t.badge}</span>
              <h2>{t.title}</h2>
              <p>{t.body}</p>
              <a className="btn btn-primary owner-cta" href="#owner-contact">
                {t.cta}
              </a>
            </div>
          ))}
        </div>

        <section className="detail-section">
          <h2 className="detail-section-title">なぜ ACRO/FINDER か</h2>
          <div className="owner-values">
            {VALUES.map((v) => (
              <div key={v.h} className="owner-value">
                <h3>{v.h}</h3>
                <p>{v.p}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="detail-section" id="owner-contact">
          <h2 className="detail-section-title">お問い合わせ</h2>
          <p className="doc-lede" style={{ marginBottom: 18 }}>
            掲載・修正・削除のご依頼、PR掲載や予約管理ツールのご相談は、下記フォームからどうぞ。
          </p>
          <ContactForm />
          <p className="muted-note" style={{ marginTop: 16 }}>
            ※ 掲載情報は各施設の公式サイト等の公開情報をもとにしています。内容の修正・削除のご依頼も歓迎します。
          </p>
        </section>
      </main>

      <JsonLd
        nonce={nonce}
        data={breadcrumbJsonLd(crumbs.map((c) => ({ name: c.name, url: `${SITE_URL}${c.href}` })))}
      />
    </div>
  );
}
