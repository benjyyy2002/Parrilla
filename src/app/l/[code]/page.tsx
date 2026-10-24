import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StandingsTable } from "@/components/standings-table";
import { formatDate } from "@/lib/dates";
import { getPublicLeague } from "@/lib/league-data";
import { computeStandings } from "@/lib/standings";
import { createClient } from "@/lib/supabase/server";
import { joinLeague } from "@/app/ligas/actions";

export async function generateMetadata({ params }: PageProps<"/l/[code]">): Promise<Metadata> {
  const { code } = await params;
  const league = await getPublicLeague(code);
  if (!league) return { title: "Liga no encontrada" };
  return {
    title: league.name,
    description: `Tabla del campeonato ${league.season} de ${league.name}.`,
  };
}

export default async function PublicLeaguePage({ params, searchParams }: PageProps<"/l/[code]">) {
  const { code } = await params;
  const joinError = (await searchParams).error === "1";
  const league = await getPublicLeague(code);
  if (!league) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: membership } = user
    ? await supabase.from("league_members").select("role").eq("league_id", league.id).eq("user_id", user.id).maybeSingle()
    : { data: null };

  const standings = computeStandings(league);
  const lastEvent = league.events.at(-1);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
      <div>
        <p className="section-title">Temporada {league.season}</p>
        <h1 className="mt-1 display text-4xl leading-none">{league.name}</h1>
        {lastEvent && (
          <p className="text-sm text-muted">
            Última fecha: {lastEvent.name} · {formatDate(lastEvent.held_on)}
          </p>
        )}
      </div>

      <StandingsTable rows={standings} />

      {league.events.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="section-title">Fechas</h2>
          <ul className="flex flex-col gap-2">
            {[...league.events].reverse().map((event) => (
              <li key={event.id}>
                <Link href={`/l/${code}/f/${event.id}`} className="card flex items-center justify-between py-3 hover:border-volt/50">
                  <span className="font-medium">{event.name}</span>
                  <span className="text-xs text-subtle">{formatDate(event.held_on)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="card flex flex-col gap-3">
        {membership ? (
          <Link href={`/ligas/${league.id}`} className="btn-primary">
            Ir a la liga
          </Link>
        ) : user ? (
          <form action={joinLeague.bind(null, code)} className="flex flex-col gap-2">
            <p className="text-sm text-fg-2">¿Corrés en esta liga? Sumate para elegir tu piloto.</p>
            <button className="btn-primary">Unirme a la liga</button>
          </form>
        ) : (
          <>
            <p className="text-sm text-fg-2">¿Corrés en esta liga? Entrá con tu mail para sumarte.</p>
            <Link href={`/login?next=${encodeURIComponent(`/l/${code}`)}`} className="btn-primary">
              Sumarme
            </Link>
          </>
        )}
        {joinError && <p className="text-sm text-danger">No pudimos sumarte. Probá de nuevo.</p>}
      </div>
    </main>
  );
}
