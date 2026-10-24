import { describe, expect, it } from "vitest";
import type { RaceOutcome } from "./f1";
import { prodeStandings, raceKey, scorePrediction, type Prediction } from "./prode-scoring";

const outcome: RaceOutcome = {
  pole: "norris",
  finish: ["max_verstappen", "leclerc", "antonelli", "norris", "piastri", "colapinto", "gasly"],
};

const empty: Prediction = { pole: null, p1: null, p2: null, p3: null, colapinto_position: null };

describe("scorePrediction", () => {
  it("pronóstico perfecto suma todo", () => {
    const score = scorePrediction(
      { pole: "norris", p1: "max_verstappen", p2: "leclerc", p3: "antonelli", colapinto_position: 6 },
      outcome,
    );
    expect(score).toEqual({ pole: 5, p1: 10, p2: 5, p3: 5, colapinto: 10, total: 35 });
  });

  it("2º y 3º en el podio pero cambiados suman 2", () => {
    const score = scorePrediction({ ...empty, p2: "antonelli", p3: "leclerc" }, outcome);
    expect([score.p2, score.p3]).toEqual([2, 2]);
  });

  it("el 2º que terminó ganando también suma 2", () => {
    expect(scorePrediction({ ...empty, p2: "max_verstappen" }, outcome).p2).toBe(2);
  });

  it("el ganador solo suma si es exacto", () => {
    expect(scorePrediction({ ...empty, p1: "leclerc" }, outcome).p1).toBe(0);
  });

  it("Colapinto: 5 si le errás por uno, 0 si por más", () => {
    expect(scorePrediction({ ...empty, colapinto_position: 7 }, outcome).colapinto).toBe(5);
    expect(scorePrediction({ ...empty, colapinto_position: 5 }, outcome).colapinto).toBe(5);
    expect(scorePrediction({ ...empty, colapinto_position: 8 }, outcome).colapinto).toBe(0);
  });

  it("si Colapinto no corrió, esa pregunta no suma", () => {
    const sinColapinto = { ...outcome, finish: outcome.finish.filter((d) => d !== "colapinto") };
    expect(scorePrediction({ ...empty, colapinto_position: 6 }, sinColapinto).colapinto).toBe(0);
  });

  it("un pronóstico vacío suma 0", () => {
    expect(scorePrediction(empty, outcome).total).toBe(0);
  });
});

describe("prodeStandings", () => {
  const members = [
    { id: "a", nickname: "Ana" },
    { id: "b", nickname: "Beto" },
    { id: "c", nickname: "Caro" },
  ];

  it("suma solo carreras con resultado y desempata por ganadores acertados", () => {
    const outcomes = new Map([[raceKey(2026, 19), outcome]]);
    const rows = prodeStandings(
      members,
      [
        // Ana: ganador (10). Beto: pole (5) + Colapinto por uno (5) = 10, sin ganador.
        { ...empty, member_id: "a", season: 2026, round: 19, p1: "max_verstappen" },
        { ...empty, member_id: "b", season: 2026, round: 19, pole: "norris", colapinto_position: 7 },
        // Carrera sin resultado todavía: no cuenta.
        { ...empty, member_id: "c", season: 2026, round: 20, p1: "max_verstappen" },
      ],
      outcomes,
    );
    expect(rows.map((r) => [r.member.nickname, r.points, r.races, r.winners])).toEqual([
      ["Ana", 10, 1, 1],
      ["Beto", 10, 1, 0],
      ["Caro", 0, 0, 0],
    ]);
  });
});
