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

/** Barlow Condensed para las imágenes. Si falla la descarga, se usa la fuente por defecto. */
export async function loadCardFonts(...texts: string[]): Promise<Fonts> {
  const text = Array.from(new Set(BASE_CHARS + texts.join(""))).join("");
  try {
    const [regular, black] = await Promise.all([
      loadGoogleFont("Barlow+Condensed:wght@600", text),
      loadGoogleFont("Barlow+Condensed:ital,wght@1,800", text),
    ]);
    return [
      { name: "Barlow", data: regular, weight: 600, style: "normal" },
      { name: "Barlow", data: black, weight: 800, style: "italic" },
    ];
  } catch {
    return [];
  }
}
