import { ImageResponse } from "next/og";
import { loadCardFonts } from "./fonts";

/** Ícono de la app: "P" lima en itálica sobre azul noche, con las franjas de velocidad del logo. */
export async function renderAppIcon(px: number) {
  const detailed = px >= 96;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#05070d",
          ...(detailed && {
            backgroundImage:
              "radial-gradient(circle at 80% 10%, rgba(46,230,255,0.28), transparent 55%), radial-gradient(circle at 10% 90%, rgba(200,255,46,0.18), transparent 50%)",
          }),
          position: "relative",
        }}
      >
        {detailed && (
          <svg
            width={px * 0.42}
            height={px * 0.28}
            viewBox="0 0 30 20"
            style={{ position: "absolute", left: px * 0.1, bottom: px * 0.16 }}
          >
            <path d="M17 0h5l-7 20h-5z" fill="#2ee6ff" />
            <path d="M24 0h5l-7 20h-5z" fill="rgba(238,242,255,0.5)" />
          </svg>
        )}
        <span
          style={{
            fontFamily: "Chakra",
            fontWeight: 700,
            fontStyle: "italic",
            fontSize: px * 0.74,
            color: "#c8ff2e",
            lineHeight: 1,
            marginLeft: detailed ? px * 0.08 : 0,
          }}
        >
          P
        </span>
      </div>
    ),
    { width: px, height: px, fonts: await loadCardFonts("P") },
  );
}
