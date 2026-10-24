import { ImageResponse } from "next/og";
import { getPublicLeague } from "@/lib/league-data";
import { LeagueCard, cardText } from "@/lib/og/cards";
import { loadCardFonts } from "@/lib/og/fonts";

export const alt = "Tabla del campeonato en Parrilla";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
// Se regenera como mucho cada minuto: WhatsApp igual guarda su propia copia.
export const revalidate = 60;

export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const league = await getPublicLeague(code);
  if (!league) return new Response("Liga no encontrada", { status: 404 });

  return new ImageResponse(<LeagueCard league={league} />, { ...size, fonts: await loadCardFonts(cardText(league)) });
}
