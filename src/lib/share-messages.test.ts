import { describe, expect, it } from "vitest";
import { eventResultMessage, leagueInviteMessage, prodeInviteMessage } from "./share-messages";
import type { EventResultRow, StandingRow } from "./standings";

const driver = (name: string) => ({ id: name, name, user_id: null });
const leader: StandingRow = {
  driver: driver("Sofi"),
  points: 68,
  races: 3,
  wins: 2,
  podiums: 3,
  fastestLaps: 1,
  bestFinish: 1,
  finishes: [2, 1],
};

describe("leagueInviteMessage", () => {
  it("menciona al puntero cuando ya hay fechas", () => {
    const text = leagueInviteMessage({ name: "Jueves", eventsCount: 3, leader });
    expect(text).toContain('*¡Armamos la liga "Jueves"!*');
    expect(text).toContain("Ya van 3 fechas y la punta la tiene *Sofi* con 68 pts");
    expect(text.split("\n").at(-1)).toBe("👉 Mirá la tabla y elegí tu piloto acá:");
  });

  it("no habla de puntero si todavía no se corrió", () => {
    expect(leagueInviteMessage({ name: "Jueves", eventsCount: 0, leader: undefined })).not.toContain("punta");
  });
});

describe("eventResultMessage", () => {
  it("arma el podio con medallas y la vuelta rápida", () => {
    const rows: EventResultRow[] = [
      { position: 1, driver: driver("Benja"), bestLapMs: 45300, points: 25, fastestLap: false },
      { position: 2, driver: driver("Tomi"), bestLapMs: 45100, points: 19, fastestLap: true },
      { position: 3, driver: driver("Juan"), bestLapMs: null, points: 15, fastestLap: false },
      { position: 4, driver: driver("Maxi"), bestLapMs: null, points: 12, fastestLap: false },
    ];
    const text = eventResultMessage({ league: "Jueves", event: "Fecha 3", rows, leader });
    expect(text).toContain("🏆 ¡Ganó *Benja*!");
    expect(text).toContain("🥇 Benja\n🥈 Tomi\n🥉 Juan");
    expect(text).not.toContain("Maxi");
    expect(text).toContain("⏱️ Vuelta rápida: *Tomi* (45.100)");
    expect(text).toContain("manda *Sofi* con 68 pts");
  });
});

describe("prodeInviteMessage", () => {
  it("incluye la próxima carrera y cuándo cierra", () => {
    const text = prodeInviteMessage({ group: "Familia", nextRace: { name: "GP de México", closes: "sáb 31 oct, 18:00" } });
    expect(text).toContain('*¡Se viene el prode de F1 "Familia"!*');
    expect(text).toContain("⏰ Próxima: *GP de México* — cierra el sáb 31 oct, 18:00");
  });
});
