import { ImageResponse } from "next/og";

export const alt = "ModernHome — Your home, done properly";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Branded social share card (warm dark, editorial). Rendered at build/edge.
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "#141210",
          backgroundImage:
            "radial-gradient(ellipse at 70% 30%, rgba(255,177,99,0.20), transparent 60%)",
          color: "#f4f1ec",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "#f4f1ec",
              color: "#22201d",
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            MH
          </div>
          <div style={{ fontSize: 30, fontWeight: 600 }}>ModernHome</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 76, fontWeight: 600, lineHeight: 1.05, maxWidth: 900 }}>
            Your home, done properly.
          </div>
          <div
            style={{
              fontSize: 30,
              color: "rgba(244,241,236,0.7)",
              fontFamily: "Helvetica, Arial, sans-serif",
            }}
          >
            Instant fixed-price quotes · Book a trusted local tradie online
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 28,
            fontSize: 22,
            color: "rgba(244,241,236,0.6)",
            fontFamily: "Helvetica, Arial, sans-serif",
          }}
        >
          <span>TV Mounting</span>
          <span>·</span>
          <span>Cabinets</span>
          <span>·</span>
          <span>LED Lighting</span>
          <span>·</span>
          <span>Heating</span>
        </div>
      </div>
    ),
    size
  );
}
