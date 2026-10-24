import type { ImageResponse } from "next/og";

type Fonts = NonNullable<NonNullable<ConstructorParameters<typeof ImageResponse>[1]>["fonts"]>;

const BASE_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÁÉÍÓÚÜÑáéíóúüñ0123456789 .,:;!¡?¿'\"()+-–—·#º°/&";

// Pide a Google Fonts solo los caracteres que usa la imagen (archivo mucho más liviano).
async function loadGoogleFont(family: string, text: string): Promise<ArrayBuffer> {
  const css = await (
    await fetch(`https://fonts.googleapis.com/css2?family=${family}&text=${encodeURIComponent(text)}`)
  ).text();
  const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
  if (!url) throw new Error(`No se encontró la fuente ${family}`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`No se pudo bajar la fuente ${family}`);
  return response.arrayBuffer();
}

/** Chakra Petch (la misma de los títulos de la app). Si falla la descarga, se usa la fuente por defecto. */
export async function loadCardFonts(...texts: string[]): Promise<Fonts> {
  // Se bajan mayúsculas y minúsculas porque los títulos van en mayúscula.
  const all = texts.join("");
  const text = Array.from(new Set(BASE_CHARS + all + all.toUpperCase())).join("");
  try {
    const [regular, bold] = await Promise.all([
      loadGoogleFont("Chakra+Petch:wght@500", text),
      loadGoogleFont("Chakra+Petch:ital,wght@1,700", text),
    ]);
    return [
      { name: "Chakra", data: regular, weight: 500, style: "normal" },
      { name: "Chakra", data: bold, weight: 700, style: "italic" },
    ];
  } catch {
    return [];
  }
}
