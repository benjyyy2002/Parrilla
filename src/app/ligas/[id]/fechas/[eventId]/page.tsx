import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EventResultsTable } from "@/components/event-results-table";
import { ShareLink } from "@/components/share-link";
import { formatDate } from "@/lib/dates";
import { getMemberLeague } from "@/lib/league-data";
import { getOrigin } from "@/lib/origin";
import { eventResults } from "@/lib/standings";
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
  const publicUrl = `${await getOrigin()}${publicPath}`;
  const winner = rows[0];

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
      <div>
        <Link href={`/ligas/${data.id}`} className="text-sm text-zinc-500 hover:text-zinc-300">
          ← {data.name}
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{event.name}</h1>
        <p className="text-sm text-zinc-400">
          {formatDate(event.held_on)}
          {event.track ? ` · ${event.track}` : ""}
        </p>
      </div>

      {editing && isAdmin ? (
        <EventForm
          leagueId={data.id}
          eventId={event.id}
          drivers={data.drivers}
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
              message={
                winner ? `🏁 ${event.name} de "${data.name}": ganó ${winner.driver.name}.` : `🏁 ${event.name} de "${data.name}":`
              }
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
