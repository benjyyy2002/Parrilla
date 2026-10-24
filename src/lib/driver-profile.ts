import { computeStandings, eventPoints, fastestLapDriverIds, type StandingRow } from "./standings";
import type { Driver, LeagueData, LeagueEvent } from "./types";

export type DriverEventLine = {
  event: LeagueEvent;
  /** null si no corrió esa fecha. */
  position: number | null;
  points: number;
  bestLapMs: number | null;
  fastestLap: boolean;
};

export type Rivalry = {
  rival: Driver;
  /** Fechas que corrieron los dos. */
  races: number;
  /** Veces que terminó adelante del rival. */
  ahead: number;
  behind: number;
};

export type DriverProfile = {
  driver: Driver;
  rank: number;
  standing: StandingRow;
  averagePosition: number | null;
  history: DriverEventLine[];
  bestLapsByTrack: { track: string; bestLapMs: number; eventName: string }[];
  rivalries: Rivalry[];
};

export function driverProfile(data: LeagueData, driverId: string): DriverProfile | null {
  const standings = computeStandings(data);
  const index = standings.findIndex((r) => r.driver.id === driverId);
  if (index === -1) return null;
  const standing = standings[index];

  const history: DriverEventLine[] = data.events.map((event) => {
    const results = data.results.filter((r) => r.event_id === event.id);
    const mine = results.find((r) => r.driver_id === driverId);
    if (!mine) return { event, position: null, points: 0, bestLapMs: null, fastestLap: false };
    const fastest = data.fastest_lap_point ? fastestLapDriverIds(results) : new Set<string>();
    return {
      event,
      position: mine.position,
      points: eventPoints(data, results).get(driverId) ?? 0,
      bestLapMs: mine.best_lap_ms,
      fastestLap: fastest.has(driverId),
    };
  });

  const finishes = history.filter((h) => h.position !== null).map((h) => h.position as number);
  const averagePosition = finishes.length ? finishes.reduce((a, b) => a + b, 0) / finishes.length : null;

  // Mejor vuelta en cada kartódromo (comparar vueltas de pistas distintas no tiene sentido).
  const byTrack = new Map<string, { track: string; bestLapMs: number; eventName: string }>();
  for (const h of history) {
    const track = h.event.track?.trim();
    if (!track || h.bestLapMs === null) continue;
    const key = track.toLowerCase();
    const current = byTrack.get(key);
    if (!current || h.bestLapMs < current.bestLapMs) {
      // Se muestra el nombre como se escribió la primera vez.
      byTrack.set(key, { track: current?.track ?? track, bestLapMs: h.bestLapMs, eventName: h.event.name });
    }
  }

  const rivalries: Rivalry[] = data.drivers
    .filter((d) => d.id !== driverId)
    .map((rival) => {
      let ahead = 0;
      let behind = 0;
      for (const event of data.events) {
        const results = data.results.filter((r) => r.event_id === event.id);
        const mine = results.find((r) => r.driver_id === driverId);
        const theirs = results.find((r) => r.driver_id === rival.id);
        if (!mine || !theirs) continue;
        if (mine.position < theirs.position) ahead++;
        else behind++;
      }
      return { rival, races: ahead + behind, ahead, behind };
    })
    .filter((r) => r.races > 0)
    .sort((a, b) => b.races - a.races || a.rival.name.localeCompare(b.rival.name, "es"));

  return {
    driver: standing.driver,
    rank: index + 1,
    standing,
    averagePosition,
    history,
    bestLapsByTrack: [...byTrack.values()].sort((a, b) => a.track.localeCompare(b.track, "es")),
    rivalries,
  };
}
