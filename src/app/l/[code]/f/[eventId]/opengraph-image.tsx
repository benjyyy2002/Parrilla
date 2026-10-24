import { ImageResponse } from "next/og";
import { getPublicLeague } from "@/lib/league-data";
import { EventCard, cardText } from "@/lib/og/cards";
import { loadCardFonts } from "@/lib/og/fonts";

export const alt = "Podio de la fecha en Parrilla";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 60;

export default async function Image({ params }: { params: Promise<{ code: string; eventId: string }> }) {
  const { code, eventId } = await params;
  const league = await getPublicLeague(code);
  const event = league?.events.find((e) => e.id === eventId);
  if (!league || !event) return new Response("Fecha no encontrada", { status: 404 });

  return new ImageResponse(<EventCard league={league} event={event} />, {
    ...size,
    fonts: await loadCardFonts(cardText(league)),
  });
}
