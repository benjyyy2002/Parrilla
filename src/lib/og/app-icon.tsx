import { ImageResponse } from "next/og";
import { loadCardFonts } from "./fonts";

/** Ícono de la app: "P" blanca en itálica sobre rojo, con una franja a cuadros (si el tamaño da). */
export async function renderAppIcon(px: number) {
  const square = px / 12;
  const showFlag = px >= 96;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#dc2626",
          position: "relative",
        }}
      >
        {showFlag && (
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, display: "flex", flexDirection: "column" }}>
            {Array.from({ length: 12 }, (_, row) => (
              <div key={row} style={{ display: "flex" }}>
                {[0, 1].map((col) => (
                  <div
                    key={col}
                    style={{ width: square, height: square, background: (row + col) % 2 ? "#09090b" : "#fafafa" }}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
        <span
          style={{
            fontFamily: "Barlow",
            fontWeight: 800,
            fontStyle: "italic",
            fontSize: px * 0.72,
            color: "#fafafa",
            marginLeft: showFlag ? square * 2 : 0,
            lineHeight: 1,
          }}
        >
          P
        </span>
      </div>
    ),
    { width: px, height: px, fonts: await loadCardFonts("P") },
  );
}
