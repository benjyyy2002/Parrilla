import { cache } from "react";
import { getOutcome, type RaceOutcome } from "@/lib/f1";
import { raceKey, type GroupPrediction, type ProdeMember, type RaceKey } from "@/lib/prode-scoring";
import { createPublicClient } from "@/lib/supabase/public";

export type ProdeRace = {
  season: number;
  round: number;
  name: string;
  circuit: string | null;
  quali_at: string;
  race_at: string;
};

export type ProdeGroupData = {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
  members: ProdeMember[];
  /** En carreras abiertas solo viene quién pronosticó (los campos llegan en null). */
  predictions: (GroupPrediction & { locked: boolean })[];
};

export const isLocked = (race: ProdeRace, now = Date.now()) => now >= Date.parse(race.quali_at);

/** Una carrera ya tiene que tener resultado (o estar por tenerlo) un rato después de la largada. */
const isFinished = (race: ProdeRace, now = Date.now()) => now >= Date.parse(race.race_at) + 2 * 3600 * 1000;

export const getProdeRaces = cache(async (): Promise<ProdeRace[]> => {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("prode_races")
    .select("season, round, name, circuit, quali_at, race_at")
    .order("quali_at");
  return data ?? [];
});

/** La próxima carrera para pronosticar (o la que se está corriendo este fin de semana). */
export function currentRace(races: ProdeRace[], now = Date.now()): ProdeRace | null {
  return races.find((r) => !isFinished(r, now)) ?? null;
}

export const getPublicProdeGroup = cache(async (code: string): Promise<ProdeGroupData | null> => {
  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("public_prode_group", { p_code: code });
  if (error || !data) return null;
  return data as ProdeGroupData;
});

/** Resultados oficiales de las carreras ya corridas (las que todavía no terminaron no se piden). */
export async function getOutcomes(races: ProdeRace[]): Promise<Map<RaceKey, RaceOutcome>> {
  const finished = races.filter((r) => isFinished(r));
  const outcomes = await Promise.all(finished.map((r) => getOutcome(r.season, r.round)));
  const map = new Map<RaceKey, RaceOutcome>();
  finished.forEach((r, i) => {
    const outcome = outcomes[i];
    if (outcome) map.set(raceKey(r.season, r.round), outcome);
  });
  return map;
}

/** "sáb 31 oct, 18:00" en hora argentina. */
export function formatRaceTime(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
}
