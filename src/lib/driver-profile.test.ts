import { describe, expect, it } from "vitest";
import { driverProfile } from "./driver-profile";
import { F1_POINTS, type LeagueData } from "./types";

const data: LeagueData = {
  id: "l1",
  name: "Liga",
  season: "2026",
  points: F1_POINTS,
  fastest_lap_point: true,
  invite_code: "abc",
  drivers: [
    { id: "ana", name: "Ana", user_id: null },
    { id: "beto", name: "Beto", user_id: null },
    { id: "caro", name: "Caro", user_id: null },
  ],
  events: [
    { id: "f1", name: "Fecha 1", track: "Zárate", held_on: "2026-11-01" },
    { id: "f2", name: "Fecha 2", track: "zárate", held_on: "2026-11-15" },
    { id: "f3", name: "Fecha 3", track: null, held_on: "2026-12-01" },
  ],
  results: [
    { event_id: "f1", driver_id: "ana", position: 1, best_lap_ms: 46000 },
    { event_id: "f1", driver_id: "beto", position: 2, best_lap_ms: 45500 },
    { event_id: "f2", driver_id: "beto", position: 1, best_lap_ms: 45000 },
    { event_id: "f2", driver_id: "ana", position: 2, best_lap_ms: 45200 },
    { event_id: "f2", driver_id: "caro", position: 3, best_lap_ms: null },
    { event_id: "f3", driver_id: "beto", position: 1, best_lap_ms: 40000 },
    { event_id: "f3", driver_id: "caro", position: 2, best_lap_ms: null },
  ],
};

describe("driverProfile", () => {
  it("devuelve null para un piloto que no es de la liga", () => {
    expect(driverProfile(data, "zoe")).toBeNull();
  });

  it("arma el historial con las fechas que no corrió", () => {
    const profile = driverProfile(data, "ana")!;
    expect(profile.history.map((h) => [h.event.id, h.position, h.points])).toEqual([
      ["f1", 1, 25],
      ["f2", 2, 18],
      ["f3", null, 0],
    ]);
    expect(profile.averagePosition).toBe(1.5);
  });

  it("calcula el puesto en el campeonato", () => {
    // Beto: 18+1 + 25+1 + 25+1 = 71 · Ana: 25 + 18 = 43 · Caro: 15 + 18 = 33
    expect(driverProfile(data, "beto")!.rank).toBe(1);
    expect(driverProfile(data, "ana")!.rank).toBe(2);
    expect(driverProfile(data, "caro")!.rank).toBe(3);
  });

  it("guarda la mejor vuelta por kartódromo sin importar mayúsculas y saltea fechas sin pista", () => {
    expect(driverProfile(data, "beto")!.bestLapsByTrack).toEqual([
      { track: "Zárate", bestLapMs: 45000, eventName: "Fecha 2" },
    ]);
  });

  it("cuenta los duelos cara a cara solo en fechas que corrieron los dos", () => {
    const rivalries = driverProfile(data, "beto")!.rivalries;
    expect(rivalries.map((r) => [r.rival.name, r.races, r.ahead, r.behind])).toEqual([
      ["Ana", 2, 1, 1],
      ["Caro", 2, 2, 0],
    ]);
  });
});
