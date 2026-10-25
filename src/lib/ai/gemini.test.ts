import { describe, expect, it } from "vitest";
import { parsePhotoResponse, PhotoReadError } from "./gemini";

describe("parsePhotoResponse", () => {
  it("ordena por posición, limpia espacios y descarta filas inválidas", () => {
    const { rows } = parsePhotoResponse({
      is_results_sheet: true,
      rows: [
        { position: 2, name: " Tomi ", kart: "7", best_lap: "45.9", league_driver: "Tomás" },
        { position: 1, name: "SOFI", kart: "", best_lap: null, league_driver: null },
        { position: 0, name: "Nadie" },
        { position: 3, name: "  " },
        { position: "x", name: "Raro" },
      ],
    });
    expect(rows).toEqual([
      { position: 1, name: "SOFI", kart: null, bestLap: null, suggested: null },
      { position: 2, name: "Tomi", kart: "7", bestLap: "45.9", suggested: "Tomás" },
    ]);
  });

  it("devuelve el día y el kartódromo cuando vienen bien", () => {
    const reading = parsePhotoResponse({ is_results_sheet: true, race_date: "2026-09-25", track: " Kartódromo Zárate ", rows: [] });
    expect(reading).toMatchObject({ date: "2026-09-25", track: "Kartódromo Zárate" });
  });

  it.each(["25/09/2026", "2026-02-31", "1999-01-01", "mañana", ""])("descarta la fecha inválida %j", (raceDate) => {
    expect(parsePhotoResponse({ is_results_sheet: true, race_date: raceDate, rows: [] }).date).toBeNull();
  });

  it("avisa cuando la foto no es una planilla", () => {
    expect(() => parsePhotoResponse({ is_results_sheet: false, rows: [] })).toThrow(PhotoReadError);
  });

  it("tolera respuestas vacías", () => {
    expect(parsePhotoResponse({})).toEqual({ rows: [], date: null, track: null });
  });
});
