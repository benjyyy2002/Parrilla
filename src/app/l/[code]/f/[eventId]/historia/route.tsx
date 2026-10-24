import { ImageResponse } from "next/og";
import { getPublicLeague } from "@/lib/league-data";
import { EventStory, cardText } from "@/lib/og/cards";
import { loadCardFonts } from "@/lib/og/fonts";
import { displayUrl, SITE_URL } from "@/lib/site";

// Imagen vertical (1080×1920) con el resultado de la fecha, para subir a historias.
export async function GET(_request: Request, { params }: RouteContext<"/l/[code]/f/[eventId]/historia">) {
  const { code, eventId } = await params;
  const league = await getPublicLeague(code);
  const event = league?.events.find((e) => e.id === eventId);
  if (!league || !event) return new Response("Fecha no encontrada", { status: 404 });

  const url = displayUrl(`${SITE_URL}/l/${code}`);
  return new ImageResponse(<EventStory league={league} event={event} url={url} />, {
    width: 1080,
    height: 1920,
    fonts: await loadCardFonts(cardText(league), url),
    headers: { "Cache-Control": "public, max-age=60" },
  });
}
