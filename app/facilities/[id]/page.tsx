import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { FACILITIES } from "@/lib/data";
import { prefectureOf, slugForPrefecture, sameAreaFacilities } from "@/lib/areas";
import { facilityJsonLd, breadcrumbJsonLd } from "@/lib/jsonld";
import { SITE_URL } from "@/lib/site";
import { SiteHeader } from "@/components/SiteHeader";
import { Breadcrumb, type Crumb } from "@/components/Breadcrumb";
import { FacilityLink } from "@/components/FacilityLink";
import { JsonLd } from "@/components/JsonLd";
import { Photo } from "@/components/Photo";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const facility = FACILITIES.find((f) => f.id === id);
  if (!facility) return { title: "施設が見つかりません" };
  const title = `${facility.name}（${facility.area}）`;
  const description =
    `${facility.nameJa}（${facility.typeLabel}）の練習施設情報 — 所在地・料金・設備・レッスン・予約・支払い方法・アクセス。${facility.description}`.slice(
      0,
      150,
    );
  const canonical = `/facilities/${facility.id}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
      title: `${title} · ACRO/FINDER`,
      description,
      ...(facility.image ? { images: [facility.image] } : {}),
    },
  };
}

export default async function FacilityPage({ params }: Props) {
  const { id } = await params;
  const facility = FACILITIES.find((f) => f.id === id);
  if (!facility) notFound();

  const pref = prefectureOf(facility);
  const slug = pref ? slugForPrefecture(pref.name) : undefined;
  const nearby = sameAreaFacilities(facility, 6);
  const canonical = `${SITE_URL}/facilities/${facility.id}`;
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const { links } = facility;

  const crumbs: Crumb[] = [
    { name: "ホーム", href: "/" },
    { name: "施設一覧", href: "/facilities" },
    ...(pref && slug ? [{ name: pref.name, href: `/area/${slug}` }] : []),
    { name: facility.name, href: `/facilities/${facility.id}` },
  ];
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${facility.lat},${facility.lng}`;

  const socialLinks: { label: string; href: string }[] = [];
  if (links.web) socialLinks.push({ label: "公式ウェブサイト", href: links.web });
  if (links.instagram)
    socialLinks.push({
      label: `Instagram ${links.instagram}`,
      href: `https://instagram.com/${links.instagram.replace(/^@/, "")}`,
    });
  if (links.twitter)
    socialLinks.push({
      label: `X ${links.twitter}`,
      href: `https://x.com/${links.twitter.replace(/^@/, "")}`,
    });
  if (links.youtube)
    socialLinks.push({ label: "YouTube", href: `https://youtube.com/${links.youtube}` });
  if (links.tiktok)
    socialLinks.push({ label: "TikTok", href: `https://tiktok.com/${links.tiktok}` });

  return (
    <div className="doc-shell">
      <SiteHeader />
      <main className="doc">
        <Breadcrumb items={crumbs} />
        <div className="doc-hero">
          <Photo data={facility.photos[0]} src={facility.image} type={facility.type} />
        </div>
        <h1>{facility.name}</h1>
        <p className="doc-sub">
          {facility.nameJa} · {facility.typeLabel}
        </p>
        {facility.tags.length > 0 && (
          <div className="doc-tags">
            {facility.tags.map((t) => (
              <span key={t} className="tag">
                {t}
              </span>
            ))}
          </div>
        )}
        <p className="doc-lede">{facility.description}</p>

        <section className="detail-section">
          <h2 className="detail-section-title">基本情報</h2>
          <div className="info-grid">
            <div className="info-cell" style={{ gridColumn: "span 2" }}>
              <div className="k">所在地</div>
              <div className="v">{facility.address}</div>
              {pref && slug && (
                <div className="sub" style={{ marginTop: 6 }}>
                  <Link href={`/area/${slug}`} prefetch={false}>
                    {pref.name}の施設をすべて見る →
                  </Link>
                </div>
              )}
            </div>
            {facility.phone && (
              <div className="info-cell">
                <div className="k">電話</div>
                <div className="v mono">{facility.phone}</div>
              </div>
            )}
            {facility.price && (
              <div className="info-cell">
                <div className="k">料金</div>
                <div className="v mono">{facility.price}</div>
                {facility.priceDay && <div className="sub">{facility.priceDay}</div>}
              </div>
            )}
            {facility.openedAt && (
              <div className="info-cell">
                <div className="k">オープン</div>
                <div className="v">{facility.openedAt}</div>
              </div>
            )}
          </div>
        </section>

        {facility.equipment && facility.equipment.length > 0 && (
          <section className="detail-section">
            <h2 className="detail-section-title">設備・器具</h2>
            <div className="equip-grid">
              {facility.equipment.map((e) => (
                <div key={e} className="equip-item">
                  <span className="equip-icon">▣</span>
                  <span>{e}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {facility.features && facility.features.length > 0 && (
          <section className="detail-section">
            <h2 className="detail-section-title">特徴</h2>
            <div className="feature-list">
              {facility.features.map((f) => (
                <span key={f} className="feature-pill">
                  {f}
                </span>
              ))}
            </div>
          </section>
        )}

        {facility.lessons && (
          <section className="detail-section">
            <h2 className="detail-section-title">レッスン</h2>
            {facility.lessons.available ? (
              <div className="lesson-card">
                <div className="lesson-types">
                  {facility.lessons.types.map((t) => (
                    <span key={t} className="lesson-pill">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="lesson-meta">
                  <div className="lesson-meta-cell">
                    <div className="k">スケジュール</div>
                    <div className="v">{facility.lessons.schedule}</div>
                  </div>
                  <div className="lesson-meta-cell">
                    <div className="k">料金</div>
                    <div className="v mono">{facility.lessons.price}</div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="muted-note">フリー練習のみの施設です。コーチング・クラスはありません。</p>
            )}
          </section>
        )}

        {facility.booking && (
          <section className="detail-section">
            <h2 className="detail-section-title">予約</h2>
            <div className="booking-grid">
              <div className="info-cell">
                <div className="k">予約</div>
                <div className="v">{facility.booking.required ? "要予約" : "予約不要"}</div>
              </div>
              <div className="info-cell">
                <div className="k">ウォークイン</div>
                <div className="v">{facility.booking.walkIn ? "可能" : "不可"}</div>
              </div>
              <div className="info-cell">
                <div className="k">予約期限</div>
                <div className="v">{facility.booking.leadTime}</div>
              </div>
              <div className="info-cell" style={{ gridColumn: "span 2" }}>
                <div className="k">予約方法</div>
                <div className="method-list">
                  {facility.booking.methods.map((m) => (
                    <span key={m} className="method-pill">
                      <span className="method-dot" />
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {facility.payment && facility.payment.length > 0 && (
          <section className="detail-section">
            <h2 className="detail-section-title">支払い方法</h2>
            <div className="feature-list">
              {facility.payment.map((p) => (
                <span key={p} className="feature-pill">
                  {p}
                </span>
              ))}
            </div>
          </section>
        )}

        {socialLinks.length > 0 && (
          <section className="detail-section">
            <h2 className="detail-section-title">公式サイト・SNS</h2>
            <ul className="doc-links">
              {socialLinks.map((l) => (
                <li key={l.href}>
                  <a href={l.href} target="_blank" rel="noreferrer">
                    {l.label} <span aria-hidden>↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="doc-cta">
          {links.web ? (
            <a className="btn btn-primary" href={links.web} target="_blank" rel="noreferrer">
              公式サイト・予約
            </a>
          ) : null}
          <a className="btn" href={directionsUrl} target="_blank" rel="noreferrer">
            経路を見る
          </a>
          <Link className="btn" href={`/?f=${facility.id}`}>
            地図で見る
          </Link>
        </div>

        {nearby.length > 0 && pref && slug && (
          <section className="detail-section">
            <h2 className="detail-section-title">
              {pref.name}の他の施設
              <Link href={`/area/${slug}`} className="section-more" prefetch={false}>
                すべて見る →
              </Link>
            </h2>
            <div className="area-grid">
              {nearby.map((f) => (
                <FacilityLink key={f.id} facility={f} />
              ))}
            </div>
          </section>
        )}

        <p className="doc-meta-note">
          情報更新 {facility.updatedAt}　·　アプリ登録 {facility.registeredAt}
        </p>
      </main>

      <JsonLd
        nonce={nonce}
        data={[
          facilityJsonLd({ facility, prefectureName: pref?.name, canonicalUrl: canonical }),
          breadcrumbJsonLd(crumbs.map((c) => ({ name: c.name, url: `${SITE_URL}${c.href}` }))),
        ]}
      />
    </div>
  );
}
