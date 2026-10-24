import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShareLink } from "@/components/share-link";
import { driverName, getGrid } from "@/lib/f1";
import { getOrigin } from "@/lib/origin";
import { currentRace, formatRaceTime, getOutcomes, getProdeRaces, getPublicProdeGroup, isLocked } from "@/lib/prode-data";
import { prodeStandings, raceKey, scorePrediction } from "@/lib/prode-scoring";
import { createClient } from "@/lib/supabase/server";
import { JoinProdeForm } from "./join-form";

export async function generateMetadata({ params }: PageProps<"/p/[code]">): Promise<Metadata> {
  const { code } = await params;
  const group = await getPublicProdeGroup(code);
  if (!group) return { title: "Grupo no encontrado" };
  return { title: `${group.name} · Prode F1`, description: `Sumate al prode de F1 "${group.name}" en Parrilla.` };
}

const podiumColors = ["text-yellow-400", "text-zinc-300", "text-amber-600"];

export default async function ProdeGroupPage({ params }: PageProps<"/p/[code]">) {
  const { code } = await params;
  const group = await getPublicProdeGroup(code);
  if (!group) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: membership } = user
    ? await supabase.from("prode_members").select("nickname").eq("group_id", group.id).eq("user_id", user.id).maybeSingle()
    : { data: null };

  const allRaces = await getProdeRaces();
  const races = allRaces.filter((r) => Date.parse(r.quali_at) >= Date.parse(group.created_at));
  const race = currentRace(races);
  const [outcomes, grid] = await Promise.all([
    getOutcomes(races),
    getGrid(race?.season ?? races.at(-1)?.season ?? new Date().getFullYear()),
  ]);

  const lockedPredictions = group.predictions.filter((p) => p.locked);
  const standings = prodeStandings(group.members, lockedPredictions, outcomes);
  const predictedNow = new Set(
    race ? group.predictions.filter((p) => p.season === race.season && p.round === race.round).map((p) => p.member_id) : [],
  );
  const pastRaces = races.filter((r) => outcomes.has(raceKey(r.season, r.round))).reverse();
  const shareUrl = `${await getOrigin()}/p/${code}`;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-8">
      <div>
        <p className="section-title">Prode F1</p>
        <h1 className="mt-1 text-3xl font-black italic tracking-tight">{group.name}</h1>
        <p className="text-sm text-zinc-400">
          {group.members.length} {group.members.length === 1 ? "jugador" : "jugadores"}
        </p>
      </div>

      {race && (
        <section className="card flex flex-col gap-3">
          <p className="section-title">Fecha {race.round}</p>
          <p className="text-xl font-black italic">{race.name}</p>
          <p className="text-sm text-zinc-400">
            {isLocked(race) ? `Cerrado · larga el ${formatRaceTime(race.race_at)}` : `Cierra el ${formatRaceTime(race.quali_at)}`}
          </p>
          <div className="flex flex-wrap gap-2">
            {group.members.map((m) => (
              <span
                key={m.id}
                className={`rounded-full px-3 py-1 text-xs ${
                  predictedNow.has(m.id) ? "bg-green-950 text-green-300" : "bg-zinc-800 text-zinc-500"
                }`}
              >
                {predictedNow.has(m.id) ? "✓ " : ""}
                {m.nickname}
              </span>
            ))}
          </div>
          {membership && (
            <Link href={`/prode/carrera/${race.season}/${race.round}`} className="btn-primary">
              {isLocked(race) ? "Ver mi pronóstico" : "Hacer / editar mi pronóstico"}
            </Link>
          )}
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="section-title">Tabla</h2>
        <div className="overflow-hidden rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900 text-xs uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="w-10 py-2 pl-3 text-left">#</th>
                <th className="py-2 text-left">Jugador</th>
                <th className="py-2 text-center" title="Ganadores acertados">
                  🏆
                </th>
                <th className="py-2 pr-3 text-right">Pts</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((row, i) => (
                <tr
                  key={row.member.id}
                  className={`border-t border-zinc-800 ${row.member.nickname === membership?.nickname ? "bg-red-950/40" : ""}`}
                >
                  <td className={`py-2.5 pl-3 font-bold ${podiumColors[i] ?? "text-zinc-500"}`}>{i + 1}</td>
                  <td className="py-2.5 font-medium">
                    {row.member.nickname}
                    <span className="ml-2 text-xs text-zinc-500">
                      {row.races} {row.races === 1 ? "carrera" : "carreras"}
                    </span>
                  </td>
                  <td className="py-2.5 text-center text-zinc-400">{row.winners}</td>
                  <td className="py-2.5 pr-3 text-right text-base font-bold tabular-nums">{row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pastRaces.length === 0 && (
          <p className="text-xs text-zinc-500">Los puntos aparecen cuando termina la primera carrera del grupo.</p>
        )}
      </section>

      {pastRaces.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="section-title">Carreras</h2>
          {pastRaces.map((r) => {
            const outcome = outcomes.get(raceKey(r.season, r.round))!;
            const rows = group.members
              .map((m) => {
                const p = lockedPredictions.find((x) => x.member_id === m.id && x.season === r.season && x.round === r.round);
                return { member: m, prediction: p, score: p ? scorePrediction(p, outcome) : null };
              })
              .sort((a, b) => (b.score?.total ?? -1) - (a.score?.total ?? -1));
            return (
              <details key={raceKey(r.season, r.round)} className="card">
                <summary className="cursor-pointer">
                  <span className="font-medium">{r.name}</span>
                  <span className="ml-2 text-xs text-zinc-500">
                    🏆 {driverName(outcome.finish[0], grid)} · pole {driverName(outcome.pole, grid)}
                  </span>
                </summary>
                <ul className="mt-3 flex flex-col divide-y divide-zinc-800 text-sm">
                  {rows.map(({ member, prediction, score }) => (
                    <li key={member.id} className="flex items-center justify-between gap-3 py-2">
                      <span className="font-medium">{member.nickname}</span>
                      <span className="flex-1 truncate text-xs text-zinc-500">
                        {prediction
                          ? `${[prediction.p1, prediction.p2, prediction.p3].map((d) => driverName(d, grid).split(" ").at(-1)).join(" · ")}${
                              prediction.colapinto_position ? ` · Colapinto P${prediction.colapinto_position}` : ""
                            }`
                          : "No pronosticó"}
                      </span>
                      <span className="font-bold tabular-nums">{score ? `+${score.total}` : "—"}</span>
                    </li>
                  ))}
                </ul>
              </details>
            );
          })}
        </section>
      )}

      {membership ? (
        <section className="card flex flex-col gap-3">
          <h2 className="section-title">Invitá al grupo</h2>
          <ShareLink url={shareUrl} message={`Sumate a nuestro prode de F1 "${group.name}" en Parrilla:`} />
        </section>
      ) : user ? (
        <JoinProdeForm code={code} />
      ) : (
        <section className="card flex flex-col gap-3">
          <p className="text-sm text-zinc-300">¿Querés jugar en este grupo? Entrá con tu cuenta para sumarte.</p>
          <Link href={`/login?next=${encodeURIComponent(`/p/${code}`)}`} className="btn-primary">
            Sumarme
          </Link>
        </section>
      )}
    </main>
  );
}
