import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isGeminiConfigured } from "@/lib/ai/gemini";
import { EventResultsTable } from "@/components/event-results-table";
import { ShareLink } from "@/components/share-link";
import { formatDate } from "@/lib/dates";
import { getMemberLeague } from "@/lib/league-data";
import { SITE_URL } from "@/lib/site";
import { eventResultMessage } from "@/lib/share-messages";
import { computeStandings, eventResults } from "@/lib/standings";
import { EventForm } from "../event-form";
import { DeleteEventButton } from "./delete-event-button";

export const metadata: Metadata = { title: "Fecha" };

export default async function EventPage({ params, searchParams }: PageProps<"/ligas/[id]/fechas/[eventId]">) {
  const { id, eventId } = await params;
  const editing = (await searchParams).editar === "1";
  const league = await getMemberLeague(id);
  if (!league) notFound();

  const { data, isAdmin } = league;
  const event = data.events.find((e) => e.id === eventId);
  if (!event) notFound();

  const rows = eventResults(data, event.id);
  const publicPath = `/l/${data.invite_code}/f/${event.id}`;
  const publicUrl = `${SITE_URL}${publicPath}`;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
      <div>
        <Link href={`/ligas/${data.id}`} className="back-link">
          ← {data.name}
        </Link>
        <h1 className="mt-2 display text-3xl leading-none">{event.name}</h1>
        <p className="text-sm text-muted">
          {formatDate(event.held_on)}
          {event.track ? ` · ${event.track}` : ""}
        </p>
      </div>

      {editing && isAdmin ? (
        <EventForm
          leagueId={data.id}
          eventId={event.id}
          drivers={data.drivers}
          photoEnabled={isGeminiConfigured()}
          initial={{
            name: event.name,
            track: event.track ?? "",
            heldOn: event.held_on,
            results: rows.map((r) => ({ driverId: r.driver.id, bestLapMs: r.bestLapMs })),
          }}
        />
      ) : (
        <>
          <EventResultsTable rows={rows} />

          <section className="card flex flex-col gap-3">
            <h2 className="section-title">Compartir resultado</h2>
            <ShareLink
              url={publicUrl}
              message={eventResultMessage({
                league: data.name,
                event: event.name,
                rows,
                leader: computeStandings(data)[0],
              })}
            />
            <a href={`${publicPath}/historia`} download={`parrilla-${event.name}.png`} className="btn-secondary">
              Descargar imagen para historias
            </a>
          </section>

          {isAdmin && (
            <div className="flex gap-2">
              <Link href={`/ligas/${data.id}/fechas/${event.id}?editar=1`} className="btn-secondary flex-1">
                Editar
              </Link>
              <DeleteEventButton leagueId={data.id} eventId={event.id} />
            </div>
          )}
        </>
      )}
    </main>
  );
}
