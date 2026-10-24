import type { Driver, League, LeagueData, Result } from "./types";

export type StandingRow = {
  driver: Driver;
  points: number;
  races: number;
  wins: number;
  podiums: number;
  fastestLaps: number;
  bestFinish: number | null;
  /** Cantidad de veces que terminó en cada puesto: finishes[0] = victorias, finishes[1] = segundos... */
  finishes: number[];
};

export function pointsForPosition(position: number, points: number[]): number {
  return points[position - 1] ?? 0;
}

/** Pilotos con la vuelta más rápida de la fecha (puede haber empate). */
export function fastestLapDriverIds(results: Result[]): Set<string> {
  const laps = results.filter((r) => r.best_lap_ms !== null).map((r) => r.best_lap_ms as number);
  if (laps.length === 0) return new Set();
  const best = Math.min(...laps);
  return new Set(results.filter((r) => r.best_lap_ms === best).map((r) => r.driver_id));
}

/** Puntos que sumó cada piloto en una fecha. */
export function eventPoints(
  league: Pick<League, "points" | "fastest_lap_point">,
  results: Result[],
): Map<string, number> {
  const fastest = league.fastest_lap_point ? fastestLapDriverIds(results) : new Set<string>();
  const totals = new Map<string, number>();
  for (const r of results) {
    const bonus = fastest.has(r.driver_id) ? 1 : 0;
    totals.set(r.driver_id, pointsForPosition(r.position, league.points) + bonus);
  }
  return totals;
}

/**
 * Tabla del campeonato. Desempata como la F1: más victorias, después más
 * segundos puestos, y así sucesivamente. Si sigue empatado, por nombre.
 */
export function computeStandings(data: LeagueData): StandingRow[] {
  const rows = new Map<string, StandingRow>(
    data.drivers.map((driver) => [
      driver.id,
      { driver, points: 0, races: 0, wins: 0, podiums: 0, fastestLaps: 0, bestFinish: null, finishes: [] },
    ]),
  );

  for (const event of data.events) {
    const results = data.results.filter((r) => r.event_id === event.id);
    const points = eventPoints(data, results);
    const fastest = fastestLapDriverIds(results);

    for (const r of results) {
      const row = rows.get(r.driver_id);
      if (!row) continue;
      row.points += points.get(r.driver_id) ?? 0;
      row.races += 1;
      if (r.position === 1) row.wins += 1;
      if (r.position <= 3) row.podiums += 1;
      if (fastest.has(r.driver_id)) row.fastestLaps += 1;
      row.bestFinish = row.bestFinish === null ? r.position : Math.min(row.bestFinish, r.position);
      row.finishes[r.position - 1] = (row.finishes[r.position - 1] ?? 0) + 1;
    }
  }

  return [...rows.values()].sort(compareRows);
}

export type EventResultRow = {
  position: number;
  driver: Driver;
  bestLapMs: number | null;
  points: number;
  fastestLap: boolean;
};

/** Resultados de una fecha, en orden de llegada, con los puntos que sumó cada uno. */
export function eventResults(data: LeagueData, eventId: string): EventResultRow[] {
  const results = data.results.filter((r) => r.event_id === eventId).sort((a, b) => a.position - b.position);
  const points = eventPoints(data, results);
  const fastest = data.fastest_lap_point ? fastestLapDriverIds(results) : new Set<string>();
  const drivers = new Map(data.drivers.map((d) => [d.id, d]));

  return results.flatMap((r) => {
    const driver = drivers.get(r.driver_id);
    if (!driver) return [];
    return [
      {
        position: r.position,
        driver,
        bestLapMs: r.best_lap_ms,
        points: points.get(r.driver_id) ?? 0,
        fastestLap: fastest.has(r.driver_id),
      },
    ];
  });
}

function compareRows(a: StandingRow, b: StandingRow): number {
  if (a.points !== b.points) return b.points - a.points;
  const depth = Math.max(a.finishes.length, b.finishes.length);
  for (let i = 0; i < depth; i++) {
    const diff = (b.finishes[i] ?? 0) - (a.finishes[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return a.driver.name.localeCompare(b.driver.name, "es");
}
