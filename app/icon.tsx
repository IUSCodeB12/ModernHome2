import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Dynamic favicon — the "MH" monogram in the brand's dark tile.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#22201d",
          color: "#f4f1ec",
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          borderRadius: 7,
        }}
      >
        MH
      </div>
    ),
    size
  );
}
