import { describe, expect, it } from "vitest";
import { computeStandings, eventPoints, fastestLapDriverIds } from "./standings";
import { F1_POINTS, type LeagueData } from "./types";

function league(overrides: Partial<LeagueData> = {}): LeagueData {
  return {
    id: "l1",
    name: "Liga de prueba",
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
      { id: "f1", name: "Fecha 1", track: null, held_on: "2026-11-01" },
      { id: "f2", name: "Fecha 2", track: null, held_on: "2026-12-01" },
    ],
    results: [],
    ...overrides,
  };
}

describe("fastestLapDriverIds", () => {
  it("devuelve vacío si nadie cargó vueltas", () => {
    expect(fastestLapDriverIds([{ event_id: "f1", driver_id: "ana", position: 1, best_lap_ms: null }]).size).toBe(0);
  });

  it("incluye a todos los empatados", () => {
    const ids = fastestLapDriverIds([
      { event_id: "f1", driver_id: "ana", position: 1, best_lap_ms: 45000 },
      { event_id: "f1", driver_id: "beto", position: 2, best_lap_ms: 45000 },
      { event_id: "f1", driver_id: "caro", position: 3, best_lap_ms: 46000 },
    ]);
    expect([...ids].sort()).toEqual(["ana", "beto"]);
  });
});

describe("eventPoints", () => {
  it("suma el punto extra por vuelta rápida solo si la liga lo usa", () => {
    const results = [
      { event_id: "f1", driver_id: "ana", position: 1, best_lap_ms: 46000 },
      { event_id: "f1", driver_id: "beto", position: 2, best_lap_ms: 45000 },
    ];
    expect(eventPoints({ points: F1_POINTS, fastest_lap_point: true }, results).get("beto")).toBe(19);
    expect(eventPoints({ points: F1_POINTS, fastest_lap_point: false }, results).get("beto")).toBe(18);
  });

  it("da 0 puntos fuera de la zona de puntos", () => {
    const results = [{ event_id: "f1", driver_id: "ana", position: 11, best_lap_ms: null }];
    expect(eventPoints({ points: F1_POINTS, fastest_lap_point: false }, results).get("ana")).toBe(0);
  });
});

describe("computeStandings", () => {
  it("ordena por puntos y cuenta victorias, podios y carreras", () => {
    const rows = computeStandings(
      league({
        results: [
          { event_id: "f1", driver_id: "ana", position: 1, best_lap_ms: 45000 },
          { event_id: "f1", driver_id: "beto", position: 2, best_lap_ms: 46000 },
          { event_id: "f2", driver_id: "beto", position: 1, best_lap_ms: 44000 },
          { event_id: "f2", driver_id: "caro", position: 2, best_lap_ms: 45000 },
        ],
      }),
    );

    expect(rows.map((r) => [r.driver.name, r.points])).toEqual([
      ["Beto", 18 + 25 + 1],
      ["Ana", 25 + 1],
      ["Caro", 18],
    ]);
    expect(rows[0]).toMatchObject({ races: 2, wins: 1, podiums: 2, fastestLaps: 1, bestFinish: 1 });
  });

  it("con mismos puntos y mismos resultados desempata por nombre", () => {
    const rows = computeStandings(
      league({
        points: [10, 5],
        fastest_lap_point: false,
        results: [
          { event_id: "f1", driver_id: "caro", position: 1, best_lap_ms: null },
          { event_id: "f1", driver_id: "beto", position: 2, best_lap_ms: null },
          { event_id: "f2", driver_id: "caro", position: 1, best_lap_ms: null },
          { event_id: "f2", driver_id: "ana", position: 2, best_lap_ms: null },
        ],
      }),
    );
    // Caro 20, Ana 5, Beto 5 → Ana antes que Beto por nombre.
    expect(rows.map((r) => r.driver.name)).toEqual(["Caro", "Ana", "Beto"]);
  });

  it("con mismos puntos gana el que tiene más victorias", () => {
    const rows = computeStandings(
      league({
        points: [10, 5],
        fastest_lap_point: false,
        results: [
          // Ana: dos segundos puestos (10). Beto: una victoria (10).
          { event_id: "f1", driver_id: "ana", position: 2, best_lap_ms: null },
          { event_id: "f2", driver_id: "ana", position: 2, best_lap_ms: null },
          { event_id: "f2", driver_id: "beto", position: 1, best_lap_ms: null },
        ],
      }),
    );
    expect(rows.slice(0, 2).map((r) => [r.driver.name, r.points])).toEqual([
      ["Beto", 10],
      ["Ana", 10],
    ]);
  });

  it("los pilotos sin carreras aparecen con 0", () => {
    const rows = computeStandings(league());
    expect(rows.every((r) => r.points === 0 && r.races === 0)).toBe(true);
  });
});
