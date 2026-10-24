import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShareLink } from "@/components/share-link";
import { StandingsTable } from "@/components/standings-table";
import { formatDate } from "@/lib/dates";
import { getMemberLeague } from "@/lib/league-data";
import { getOrigin } from "@/lib/origin";
import { computeStandings } from "@/lib/standings";
import { removeDriver } from "../actions";
import { AddDriversForm, ClaimDriverForm } from "./driver-forms";

export async function generateMetadata({ params }: PageProps<"/ligas/[id]">): Promise<Metadata> {
  const { id } = await params;
  const league = await getMemberLeague(id);
  return { title: league?.data.name ?? "Liga" };
}

export default async function LeaguePage({ params }: PageProps<"/ligas/[id]">) {
  const { id } = await params;
  const league = await getMemberLeague(id);
  if (!league) notFound();

  const { data, isAdmin, myDriverId } = league;
  const standings = computeStandings(data);
  const racesByDriver = new Map(standings.map((r) => [r.driver.id, r.races]));
  const shareUrl = `${await getOrigin()}/l/${data.invite_code}`;
  const freeDrivers = data.drivers.filter((d) => !d.user_id);
  const events = [...data.events].reverse();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-8">
      <div>
        <Link href="/ligas" className="text-sm text-zinc-500 hover:text-zinc-300">
          ← Mis ligas
        </Link>
        <h1 className="mt-2 text-3xl font-black italic tracking-tight">{data.name}</h1>
        <p className="text-sm text-zinc-400">
          Temporada {data.season} · {data.events.length} {data.events.length === 1 ? "fecha" : "fechas"}
        </p>
      </div>

      {!myDriverId && <ClaimDriverForm leagueId={data.id} freeDrivers={freeDrivers} />}

      <section className="flex flex-col gap-3">
        <h2 className="section-title">Campeonato</h2>
        <StandingsTable rows={standings} highlightDriverId={myDriverId} driverHrefPrefix={`/ligas/${data.id}/pilotos/`} />
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="section-title">Fechas</h2>
          {isAdmin && data.drivers.length > 0 && (
            <Link href={`/ligas/${data.id}/fechas/nueva`} className="btn-primary py-2 text-sm">
              + Cargar fecha
            </Link>
          )}
        </div>
        {events.length === 0 ? (
          <p className="text-sm text-zinc-400">
            {isAdmin ? "Cuando vuelvan del karting, cargá la primera fecha." : "Todavía no se corrió ninguna fecha."}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {events.map((event) => {
              const winner = data.results.find((r) => r.event_id === event.id && r.position === 1);
              const winnerName = data.drivers.find((d) => d.id === winner?.driver_id)?.name;
              return (
                <li key={event.id}>
                  <Link
                    href={`/ligas/${data.id}/fechas/${event.id}`}
                    className="card flex items-center justify-between py-3 hover:border-zinc-600"
                  >
                    <div>
                      <p className="font-medium">{event.name}</p>
                      <p className="text-xs text-zinc-500">
                        {formatDate(event.held_on)}
                        {event.track ? ` · ${event.track}` : ""}
                      </p>
                    </div>
                    {winnerName && <span className="text-sm text-zinc-300">🏆 {winnerName}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="section-title">Invitá al grupo</h2>
        <div className="card">
          <p className="mb-3 text-sm text-zinc-400">Con este link cualquiera ve la tabla. Para sumarse a la liga, entran con su mail.</p>
          <ShareLink url={shareUrl} message={`Sumate a la liga "${data.name}" en Parrilla y mirá la tabla:`} />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="section-title">Pilotos ({data.drivers.length})</h2>
        <ul className="card flex flex-col divide-y divide-zinc-800 py-1">
          {data.drivers.map((driver) => (
            <li key={driver.id} className="flex items-center justify-between py-2">
              <span>
                <Link href={`/ligas/${data.id}/pilotos/${driver.id}`} className="hover:underline">
                  {driver.name}
                </Link>
                {driver.id === myDriverId && <span className="ml-2 text-xs text-red-400">vos</span>}
                {driver.user_id && driver.id !== myDriverId && <span className="ml-2 text-xs text-zinc-500">con cuenta</span>}
              </span>
              {isAdmin && !racesByDriver.get(driver.id) && driver.id !== myDriverId && (
                <form action={removeDriver.bind(null, data.id, driver.id)}>
                  <button className="text-xs text-zinc-500 hover:text-red-400">Quitar</button>
                </form>
              )}
            </li>
          ))}
        </ul>
        {isAdmin && <AddDriversForm leagueId={data.id} />}
      </section>
    </main>
  );
}
