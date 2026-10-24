import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EventResultsTable } from "@/components/event-results-table";
import { formatDate } from "@/lib/dates";
import { getPublicLeague } from "@/lib/league-data";
import { eventResults } from "@/lib/standings";

export async function generateMetadata({ params }: PageProps<"/l/[code]/f/[eventId]">): Promise<Metadata> {
  const { code, eventId } = await params;
  const league = await getPublicLeague(code);
  const event = league?.events.find((e) => e.id === eventId);
  if (!league || !event) return { title: "Fecha no encontrada" };
  const winner = eventResults(league, event.id)[0];
  return {
    title: `${event.name} · ${league.name}`,
    description: winner ? `Ganó ${winner.driver.name}. Mirá el resultado completo y la tabla.` : undefined,
  };
}

export default async function PublicEventPage({ params }: PageProps<"/l/[code]/f/[eventId]">) {
  const { code, eventId } = await params;
  const league = await getPublicLeague(code);
  const event = league?.events.find((e) => e.id === eventId);
  if (!league || !event) notFound();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
      <div>
        <Link href={`/l/${code}`} className="text-sm text-zinc-500 hover:text-zinc-300">
          ← {league.name}
        </Link>
        <h1 className="mt-2 text-3xl font-black italic tracking-tight">{event.name}</h1>
        <p className="text-sm text-zinc-400">
          {formatDate(event.held_on)}
          {event.track ? ` · ${event.track}` : ""}
        </p>
      </div>

      <EventResultsTable rows={eventResults(league, event.id)} />

      <Link href={`/l/${code}`} className="btn-primary">
        Ver la tabla del campeonato
      </Link>
    </main>
  );
}
