import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { driverName, getGrid, getOutcome } from "@/lib/f1";
import { formatRaceTime, getProdeRaces, isLocked } from "@/lib/prode-data";
import { colapintoPosition, scorePrediction } from "@/lib/prode-scoring";
import { createClient } from "@/lib/supabase/server";
import { PredictionForm } from "./prediction-form";

export const metadata: Metadata = { title: "Mi pronóstico" };

export default async function RacePredictionPage({ params }: PageProps<"/prode/carrera/[season]/[round]">) {
  const { season: seasonParam, round: roundParam } = await params;
  const season = Number(seasonParam);
  const round = Number(roundParam);

  const races = await getProdeRaces();
  const race = races.find((r) => r.season === season && r.round === round);
  if (!race) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [grid, { data: prediction }, outcome] = await Promise.all([
    getGrid(season),
    supabase
      .from("prode_predictions")
      .select("pole, p1, p2, p3, colapinto_position")
      .eq("user_id", user?.id ?? "")
      .eq("season", season)
      .eq("round", round)
      .maybeSingle(),
    isLocked(race) ? getOutcome(season, round) : Promise.resolve(null),
  ]);

  const locked = isLocked(race);
  const score = prediction && outcome ? scorePrediction(prediction, outcome) : null;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
      <div>
        <Link href="/prode" className="back-link">
          ← Prode
        </Link>
        <p className="mt-2 section-title">Fecha {race.round}</p>
        <h1 className="display text-4xl leading-none">{race.name}</h1>
        <p className="text-sm text-muted">
          {locked ? `Cerrado · larga el ${formatRaceTime(race.race_at)}` : `Cierra el ${formatRaceTime(race.quali_at)}`}
        </p>
      </div>

      {!locked ? (
        grid.length === 0 ? (
          <p className="card text-sm text-muted">No pudimos cargar la lista de pilotos. Probá de nuevo en un rato.</p>
        ) : (
          <PredictionForm
            season={season}
            round={round}
            grid={grid}
            initial={{
              pole: prediction?.pole ?? "",
              p1: prediction?.p1 ?? "",
              p2: prediction?.p2 ?? "",
              p3: prediction?.p3 ?? "",
              colapintoPosition: prediction?.colapinto_position ? String(prediction.colapinto_position) : "",
            }}
          />
        )
      ) : !prediction ? (
        <p className="card text-sm text-muted">No pronosticaste esta carrera.</p>
      ) : (
        <div className="timing-wrap">
          <table className="timing">
            <thead>
              <tr>
                <th className="py-2 pl-3 text-left">Pregunta</th>
                <th className="py-2 text-left">Tu pronóstico</th>
                <th className="py-2 text-left">{outcome ? "Resultado" : ""}</th>
                <th className="py-2 pr-3 text-right">{score ? "Pts" : ""}</th>
              </tr>
            </thead>
            <tbody>
              {[
                { q: "Pole", mine: driverName(prediction.pole, grid), real: outcome && driverName(outcome.pole, grid), pts: score?.pole },
                { q: "Ganador", mine: driverName(prediction.p1, grid), real: outcome && driverName(outcome.finish[0], grid), pts: score?.p1 },
                { q: "2º", mine: driverName(prediction.p2, grid), real: outcome && driverName(outcome.finish[1], grid), pts: score?.p2 },
                { q: "3º", mine: driverName(prediction.p3, grid), real: outcome && driverName(outcome.finish[2], grid), pts: score?.p3 },
                {
                  q: "Colapinto",
                  mine: prediction.colapinto_position ? `P${prediction.colapinto_position}` : "—",
                  real: outcome && (colapintoPosition(outcome) ? `P${colapintoPosition(outcome)}` : "No corrió"),
                  pts: score?.colapinto,
                },
              ].map((row) => (
                <tr key={row.q}>
                  <td className="py-2.5 pl-3 text-muted">{row.q}</td>
                  <td className="py-2.5 font-medium">{row.mine}</td>
                  <td className="py-2.5 text-fg-2">{row.real ?? ""}</td>
                  <td className={`py-2.5 pr-3 text-right font-bold tabular-nums ${row.pts ? "text-volt" : "text-subtle"}`}>
                    {row.pts === undefined ? "" : `+${row.pts}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {score ? (
            <p className="border-t border-line px-3 py-2.5 text-right font-bold">Total: {score.total} pts</p>
          ) : (
            <p className="border-t border-line px-3 py-2.5 text-sm text-muted">
              Los puntos aparecen cuando se publica el resultado oficial (un rato después de la carrera).
            </p>
          )}
        </div>
      )}
    </main>
  );
}
