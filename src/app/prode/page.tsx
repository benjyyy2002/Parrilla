import type { Metadata } from "next";
import Link from "next/link";
import { RaceBanner } from "@/components/race-banner";
import { currentRace, getProdeRaces, isLocked } from "@/lib/prode-data";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Prode F1" };

export default async function ProdePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [races, { data: memberships }] = await Promise.all([
    getProdeRaces(),
    supabase
      .from("prode_members")
      .select("nickname, prode_groups(name, invite_code)")
      .eq("user_id", user?.id ?? "")
      .order("joined_at", { ascending: false }),
  ]);

  const race = currentRace(races);
  const { data: myPrediction } = race
    ? await supabase
        .from("prode_predictions")
        .select("p1")
        .eq("user_id", user?.id ?? "")
        .eq("season", race.season)
        .eq("round", race.round)
        .maybeSingle()
    : { data: null };

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-8">
      <div>
        <p className="section-title">Fórmula 1 · {race?.season ?? new Date().getFullYear()}</p>
        <h1 className="display mt-1 text-4xl leading-none">Prode</h1>
      </div>

      {race ? (
        <RaceBanner race={race}>
          {myPrediction && !isLocked(race) && (
            <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-volt">✓ Ya pronosticaste esta carrera</p>
          )}
          <Link href={`/prode/carrera/${race.season}/${race.round}`} className="btn-primary">
            {isLocked(race) ? "Ver mi pronóstico" : myPrediction ? "Editar mi pronóstico" : "Hacer mi pronóstico"}
          </Link>
        </RaceBanner>
      ) : (
        <p className="card text-sm text-muted">No hay carreras cargadas por ahora. ¡Nos vemos la próxima temporada!</p>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="section-title">Mis grupos</h2>
          <Link href="/prode/nuevo" className="btn-secondary py-1.5 text-sm">
            + Nuevo grupo
          </Link>
        </div>
        {!memberships || memberships.length === 0 ? (
          <p className="text-sm text-muted">
            Armá un grupo con tu familia o tus amigos, o pedile a alguien el link del suyo. Tu pronóstico vale para todos tus
            grupos.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {memberships.map((m) => {
              const group = Array.isArray(m.prode_groups) ? m.prode_groups[0] : m.prode_groups;
              if (!group) return null;
              return (
                <li key={group.invite_code}>
                  <Link href={`/p/${group.invite_code}`} className="card flex items-center justify-between py-3 hover:border-volt/50">
                    <span className="font-medium">{group.name}</span>
                    <span className="text-xs text-subtle">como {m.nickname} →</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="card text-sm text-muted">
        <p className="mb-2 font-semibold text-fg">Cómo se juega</p>
        <ul className="flex list-disc flex-col gap-1 pl-5">
          <li>Pole: 5 puntos.</li>
          <li>Ganador: 10 puntos.</li>
          <li>2º y 3º: 5 si acertás el puesto, 2 si está en el podio pero en otro lugar.</li>
          <li>Posición de Colapinto: 10 si es exacta, 5 si le errás por uno.</li>
          <li>Se cierra al empezar la clasificación. Los pronósticos de los demás se ven recién ahí.</li>
        </ul>
      </section>
    </main>
  );
}
