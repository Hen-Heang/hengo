import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "Hengo — Korean for Developers"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px",
        background: "linear-gradient(135deg, #0a1422 0%, #0f1b30 55%, #10223d 100%)",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            display: "flex",
            width: 56,
            height: 56,
            borderRadius: 16,
            background: "linear-gradient(135deg, #3b82f6, #6366f1)",
          }}
        />
        <div style={{ fontSize: 32, fontWeight: 700, color: "#ffffff" }}>Hengo</div>
      </div>

      <div
        style={{
          display: "flex",
          marginTop: 48,
          fontSize: 60,
          fontWeight: 700,
          lineHeight: 1.15,
          color: "#ffffff",
          maxWidth: 980,
        }}
      >
        Thrive on a Korean dev team.
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 8,
          fontSize: 60,
          fontWeight: 700,
          lineHeight: 1.15,
          background: "linear-gradient(90deg, #3b82f6, #6366f1, #0ea5e9)",
          backgroundClip: "text",
          color: "transparent",
          maxWidth: 980,
        }}
      >
        Learn the Korean that matters.
      </div>

      <div
        style={{ display: "flex", marginTop: 40, fontSize: 28, color: "#94a3b8", maxWidth: 820 }}
      >
        AI coach, workplace scenarios, and developer vocabulary — built for foreign engineers in
        Korea.
      </div>
    </div>,
    { ...size },
  )
}
