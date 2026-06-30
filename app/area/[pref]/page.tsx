import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { prefectureBySlug, facilitiesInPrefecture, prefectureSummary } from "@/lib/areas";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/jsonld";
import { SITE_URL } from "@/lib/site";
import { SiteHeader } from "@/components/SiteHeader";
import { Breadcrumb, type Crumb } from "@/components/Breadcrumb";
import { FacilityLink } from "@/components/FacilityLink";
import { JsonLd } from "@/components/JsonLd";

interface Props {
  params: Promise<{ pref: string }>;
}

const TYPE_LABELS: Record<string, string> = {
  parkour: "パルクール",
  tricking: "トリッキング",
  mixed: "複合",
};

// "パルクール12・複合5・トリッキング2" — real per-prefecture type breakdown.
function typeBreakdownText(byType: Record<string, number>): string {
  return (["parkour", "tricking", "mixed"] as const)
    .filter((t) => byType[t] > 0)
    .sort((a, b) => byType[b] - byType[a])
    .map((t) => `${TYPE_LABELS[t]}${byType[t]}`)
    .join("・");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pref: slug } = await params;
  const pref = prefectureBySlug(slug);
  if (!pref) return { title: "エリアが見つかりません" };
  const s = prefectureSummary(pref.name);
  const breakdown = typeBreakdownText(s.byType);
  const title = `${pref.name}のアクロバット練習施設（${s.total}件）`;
  const description = `${pref.name}でトリッキング・パルクール・アクロバットを練習できる施設${s.total}件（${breakdown}）。${s.cities.slice(0, 5).join("・")}など。料金・設備・レッスン・予約・アクセスつき。`;
  return {
    title,
    description,
    alternates: { canonical: `/area/${slug}` },
    openGraph: {
      type: "website",
      url: `/area/${slug}`,
      title: `${title} · ACRO/FINDER`,
      description,
    },
  };
}

export default async function AreaPage({ params }: Props) {
  const { pref: slug } = await params;
  const pref = prefectureBySlug(slug);
  if (!pref) notFound();
  const list = facilitiesInPrefecture(pref.name);
  if (list.length === 0) notFound();
  const s = prefectureSummary(pref.name);
  const breakdown = typeBreakdownText(s.byType);
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  const crumbs: Crumb[] = [
    { name: "ホーム", href: "/" },
    { name: "施設一覧", href: "/facilities" },
    { name: pref.name, href: `/area/${slug}` },
  ];

  return (
    <div className="doc-shell">
      <SiteHeader active="facilities" />
      <main className="doc">
        <Breadcrumb items={crumbs} />
        <h1>{pref.name}のアクロバット練習施設</h1>
        <p className="doc-sub">
          {s.total} 施設 · {breakdown}
        </p>
        <p className="doc-lede">
          {pref.name}にはトリッキング・パルクール・アクロバット（体操・宙返り）を練習できる施設が
          {s.total}件あります（{breakdown}）。
          {s.cities.length > 0 && `${s.cities.slice(0, 8).join("・")}などのエリアに分布しています。`}
          各施設の料金・設備・レッスンの有無・予約方法・支払い方法・アクセスをまとめています。
        </p>
        <div className="area-grid">
          {list.map((f) => (
            <FacilityLink key={f.id} facility={f} />
          ))}
        </div>
      </main>

      <JsonLd
        nonce={nonce}
        data={[
          breadcrumbJsonLd(crumbs.map((c) => ({ name: c.name, url: `${SITE_URL}${c.href}` }))),
          itemListJsonLd(list.map((f) => ({ name: f.name, url: `${SITE_URL}/facilities/${f.id}` }))),
        ]}
      />
    </div>
  );
}
