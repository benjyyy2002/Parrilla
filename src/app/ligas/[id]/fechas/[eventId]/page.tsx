import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/dates";
import { formatLapTime } from "@/lib/laptime";
import { getMemberLeague } from "@/lib/league-data";
import { eventPoints, fastestLapDriverIds } from "@/lib/standings";
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

  const results = data.results.filter((r) => r.event_id === event.id).sort((a, b) => a.position - b.position);
  const points = eventPoints(data, results);
  const fastest = data.fastest_lap_point ? fastestLapDriverIds(results) : new Set<string>();
  const driverName = (driverId: string) => data.drivers.find((d) => d.id === driverId)?.name ?? "?";

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
            results: results.map((r) => ({ driverId: r.driver_id, bestLapMs: r.best_lap_ms })),
          }}
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-zinc-800">
            <table className="w-full text-sm">
              <thead className="bg-zinc-900 text-xs uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="w-10 py-2 pl-3 text-left">#</th>
                  <th className="py-2 text-left">Piloto</th>
                  <th className="py-2 text-right">Mejor vuelta</th>
                  <th className="py-2 pr-3 text-right">Pts</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.driver_id} className="border-t border-zinc-800">
                    <td className="py-2.5 pl-3 font-bold text-zinc-400">{r.position}</td>
                    <td className="py-2.5 font-medium">{driverName(r.driver_id)}</td>
                    <td className="py-2.5 text-right tabular-nums text-zinc-300">
                      {r.best_lap_ms ? formatLapTime(r.best_lap_ms) : "—"}
                      {fastest.has(r.driver_id) && <span className="ml-1 text-purple-400">⏱</span>}
                    </td>
                    <td className="py-2.5 pr-3 text-right font-bold tabular-nums">+{points.get(r.driver_id) ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {fastest.size > 0 && <p className="text-xs text-zinc-500">⏱ Vuelta más rápida (+1 punto)</p>}

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
