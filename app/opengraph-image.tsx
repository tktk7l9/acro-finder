import { ImageResponse } from "next/og";

export const alt = "ACRO/FINDER — アクロバット練習施設を地図とリストで検索";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0e0f0d",
          color: "#f1f3ec",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
          <div
            style={{
              width: 92,
              height: 92,
              borderRadius: 20,
              background: "#cee85b",
              color: "#0c0e0a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 62,
              fontWeight: 800,
            }}
          >
            A
          </div>
          <div style={{ display: "flex", fontSize: 25, letterSpacing: 7, color: "#8a8f7c" }}>
            ACROBATICS FACILITY FINDER
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", fontSize: 134, fontWeight: 800, letterSpacing: -3 }}>
            <span>ACRO</span>
            <span style={{ color: "#cee85b" }}>/</span>
            <span>FINDER</span>
          </div>
          <div style={{ display: "flex", fontSize: 35, color: "#c6cab8" }}>
            Tricking · Parkour · Acrobatics — training facilities across Japan
          </div>
        </div>

        <div style={{ display: "flex", gap: 16 }}>
          {["MAP & LIST", "HOURS", "EQUIPMENT", "LESSONS", "NEARBY"].map((t) => (
            <div
              key={t}
              style={{
                display: "flex",
                padding: "12px 22px",
                borderRadius: 999,
                border: "1px solid #353a2e",
                color: "#8a8f7c",
                fontSize: 23,
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
