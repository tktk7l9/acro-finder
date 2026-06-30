"use client";

import { useEffect, useState } from "react";
import type { Facility } from "@/lib/types";
import { EQUIPMENT_FILTERS } from "@/lib/data";
import { formatDistance } from "@/lib/util";
import { Photo, Star } from "./Photo";
import { StatusPill } from "./StatusPill";
import { HoursTable } from "./HoursTable";

const FAV_KEY = "acro-finder:favorites";

const PAYMENT_META: Record<string, { icon: string; class: string }> = {
  現金: { icon: "¥", class: "pay-cash" },
  クレジットカード: { icon: "▭", class: "pay-cc" },
  PayPay: { icon: "P", class: "pay-paypay" },
  "LINE Pay": { icon: "L", class: "pay-line" },
  楽天Pay: { icon: "R", class: "pay-rakuten" },
  交通系IC: { icon: "IC", class: "pay-ic" },
  "Apple Pay": { icon: "", class: "pay-apple" },
};

interface Props {
  facility: Facility | null;
  onClose: () => void;
}

export function DetailPanel({ facility, onClose }: Props) {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      if (raw) setFavorites(JSON.parse(raw) as string[]);
    } catch {
      /* localStorage unavailable */
    }
  }, []);

  if (!facility) return null;
  const { links } = facility;
  const isFavorite = favorites.includes(facility.id);
  const toggleFavorite = () => {
    setFavorites((prev) => {
      const next = prev.includes(facility.id)
        ? prev.filter((id) => id !== facility.id)
        : [...prev, facility.id];
      try {
        localStorage.setItem(FAV_KEY, JSON.stringify(next));
      } catch {
        /* localStorage unavailable */
      }
      return next;
    });
  };
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${facility.lat},${facility.lng}`;
  return (
    <aside className="detail open">
      <div className="detail-hero">
        <Photo data={facility.photos[0]} src={facility.image} type={facility.type} />
        <div className="detail-hero-overlay" />
        <button className="detail-close" onClick={onClose}>
          ✕
        </button>
        <div className="detail-hero-content">
          <h2 className="detail-name">{facility.name}</h2>
          <p className="detail-name-ja">
            {facility.nameJa} · {facility.typeLabel}
          </p>
          <div className="detail-meta-row">
            {facility.rating !== undefined && (
              <span className="rating">
                <Star />
                {facility.rating.toFixed(1)}{" "}
                {facility.reviewCount !== undefined && (
                  <span
                    style={{ color: "var(--ink-3)", fontWeight: 400, fontSize: 12, marginLeft: 4 }}
                  >
                    {facility.reviewCount}件
                  </span>
                )}
              </span>
            )}
            {facility.isOpen !== undefined && (
              <StatusPill open={facility.isOpen} closesAt={facility.closesAt ?? ""} />
            )}
          </div>
        </div>
      </div>

      <div className="detail-body">
        <section className="detail-section">
          <h4 className="detail-section-title">
            About <span className="jp">施設について</span>
          </h4>
          <p style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.7, margin: 0 }}>
            {facility.description}
          </p>
        </section>

        <section className="detail-section">
          <h4 className="detail-section-title">
            Photos <span className="jp">施設内</span>
          </h4>
          <div className="photo-grid">
            {facility.photos.map((p, i) => (
              <div key={i}>
                <Photo data={p} />
              </div>
            ))}
          </div>
        </section>

        <section className="detail-section">
          <h4 className="detail-section-title">
            Info <span className="jp">基本情報</span>
          </h4>
          <div className="info-grid">
            <div className="info-cell" style={{ gridColumn: "span 2" }}>
              <div className="k">Address / 所在地</div>
              <div className="v" style={{ fontSize: 13 }}>
                {facility.address}
              </div>
              <div className="sub" style={{ marginTop: 4, fontFamily: "var(--font-en)" }}>
                距離 {formatDistance(facility.distance)}
              </div>
            </div>
            {facility.phone && (
              <div className="info-cell">
                <div className="k">Phone / 電話</div>
                <div className="v mono">{facility.phone}</div>
              </div>
            )}
            {facility.price && (
              <div className="info-cell">
                <div className="k">Price / 料金</div>
                <div className="v mono">{facility.price}</div>
                {facility.priceDay && <div className="sub">{facility.priceDay}</div>}
              </div>
            )}
            {facility.openedAt && (
              <div className="info-cell">
                <div className="k">Opened / オープン</div>
                <div className="v">{facility.openedAt}</div>
              </div>
            )}
          </div>
        </section>

        {facility.hours && (
        <section className="detail-section">
          <h4 className="detail-section-title">
            Hours <span className="jp">営業時間</span>
          </h4>
          <HoursTable hours={facility.hours} />
        </section>
        )}

        {facility.equipment && facility.equipment.length > 0 && (
        <section className="detail-section">
          <h4 className="detail-section-title">
            Equipment <span className="jp">設備・器具 ({facility.equipment.length})</span>
          </h4>
          <div className="equip-grid">
            {facility.equipment.map((e) => {
              const ef = EQUIPMENT_FILTERS.find((x) => e.includes(x.key));
              return (
                <div key={e} className="equip-item">
                  <span className="equip-icon">{ef?.icon ?? "▣"}</span>
                  <span>{e}</span>
                </div>
              );
            })}
          </div>
        </section>
        )}

        {facility.features && facility.features.length > 0 && (
        <section className="detail-section">
          <h4 className="detail-section-title">
            Features <span className="jp">特徴</span>
          </h4>
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
          <h4 className="detail-section-title">
            Lessons <span className="jp">レッスン</span>
            <span className={`section-status ${facility.lessons.available ? "on" : "off"}`}>
              {facility.lessons.available ? "● あり" : "○ なし"}
            </span>
          </h4>
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
                  <div className="k">開催スケジュール</div>
                  <div className="v">{facility.lessons.schedule}</div>
                </div>
                <div className="lesson-meta-cell">
                  <div className="k">料金</div>
                  <div className="v mono">{facility.lessons.price}</div>
                </div>
              </div>
            </div>
          ) : (
            <p className="muted-note">
              フリー練習のみの施設です。コーチング・クラスはありません。
            </p>
          )}
        </section>
        )}

        {facility.booking && (
        <section className="detail-section">
          <h4 className="detail-section-title">
            Booking <span className="jp">予約</span>
            <span className={`section-status ${facility.booking.required ? "req" : "opt"}`}>
              {facility.booking.required ? "● 要予約" : "○ 予約不要"}
            </span>
          </h4>
          <div className="booking-grid">
            <div className="info-cell">
              <div className="k">ウォークイン</div>
              <div className="v">{facility.booking.walkIn ? "可能" : "不可（要予約）"}</div>
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
          <h4 className="detail-section-title">
            Payment <span className="jp">支払い方法</span>
          </h4>
          <div className="pay-grid">
            {facility.payment.map((p) => {
              const meta = PAYMENT_META[p] ?? { icon: "$", class: "pay-other" };
              return (
                <div key={p} className={`pay-cell ${meta.class}`}>
                  <span className="pay-icon">{meta.icon}</span>
                  <span className="pay-name">{p}</span>
                </div>
              );
            })}
          </div>
        </section>
        )}

        {(links.web || links.instagram || links.twitter || links.youtube || links.tiktok) && (
        <section className="detail-section">
          <h4 className="detail-section-title">
            Links <span className="jp">公式HP・SNS</span>
          </h4>
          <div className="links-list">
            {links.web && (
              <a className="link-row" href={links.web} target="_blank" rel="noreferrer">
                <span className="link-icon" data-net="web">
                  ◐
                </span>
                <span className="link-body">
                  <span className="link-label">公式ウェブサイト</span>
                  <span className="link-handle">{links.web.replace(/^https?:\/\//, "")}</span>
                </span>
                <span className="link-arrow">↗</span>
              </a>
            )}
            {links.instagram && (
              <a
                className="link-row"
                href={`https://instagram.com/${links.instagram.replace("@", "")}`}
                target="_blank"
                rel="noreferrer"
              >
                <span className="link-icon" data-net="ig">
                  IG
                </span>
                <span className="link-body">
                  <span className="link-label">Instagram</span>
                  <span className="link-handle">{links.instagram}</span>
                </span>
                <span className="link-arrow">↗</span>
              </a>
            )}
            {links.twitter && (
              <a
                className="link-row"
                href={`https://x.com/${links.twitter.replace("@", "")}`}
                target="_blank"
                rel="noreferrer"
              >
                <span className="link-icon" data-net="x">
                  𝕏
                </span>
                <span className="link-body">
                  <span className="link-label">X (Twitter)</span>
                  <span className="link-handle">{links.twitter}</span>
                </span>
                <span className="link-arrow">↗</span>
              </a>
            )}
            {links.youtube && (
              <a
                className="link-row"
                href={`https://youtube.com/${links.youtube}`}
                target="_blank"
                rel="noreferrer"
              >
                <span className="link-icon" data-net="yt">
                  ▶
                </span>
                <span className="link-body">
                  <span className="link-label">YouTube</span>
                  <span className="link-handle">{links.youtube}</span>
                </span>
                <span className="link-arrow">↗</span>
              </a>
            )}
            {links.tiktok && (
              <a
                className="link-row"
                href={`https://tiktok.com/${links.tiktok}`}
                target="_blank"
                rel="noreferrer"
              >
                <span className="link-icon" data-net="tt">
                  ♪
                </span>
                <span className="link-body">
                  <span className="link-label">TikTok</span>
                  <span className="link-handle">{links.tiktok}</span>
                </span>
                <span className="link-arrow">↗</span>
              </a>
            )}
          </div>
        </section>
        )}

        <a className="detail-fullpage-link" href={`/facilities/${facility.id}`}>
          詳細・アクセス情報ページを開く →
        </a>

        <p className="detail-dates">
          アプリ登録 {facility.registeredAt}　·　情報更新 {facility.updatedAt}
        </p>

        <div className="detail-cta">
          {links.web ? (
            <a className="btn-primary btn" href={links.web} target="_blank" rel="noreferrer">
              予約する
            </a>
          ) : (
            <button className="btn-primary btn" disabled>
              予約する
            </button>
          )}
          <a className="btn" href={directionsUrl} target="_blank" rel="noreferrer">
            経路を見る
          </a>
          <button
            className="btn"
            onClick={toggleFavorite}
            aria-pressed={isFavorite}
            title={isFavorite ? "お気に入りから外す" : "お気に入りに追加"}
            style={isFavorite ? { color: "var(--accent)", borderColor: "var(--accent)" } : undefined}
          >
            {isFavorite ? "★" : "☆"}
          </button>
        </div>
      </div>
    </aside>
  );
}
