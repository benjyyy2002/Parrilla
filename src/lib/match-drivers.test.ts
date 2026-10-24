import { describe, expect, it } from "vitest";
import { matchDrivers, normalizeName, similarity } from "./match-drivers";
import type { Driver } from "./types";

const drivers: Driver[] = [
  { id: "1", name: "Benja", user_id: null },
  { id: "2", name: "Tomás", user_id: null },
  { id: "3", name: "Sofi Pérez", user_id: null },
  { id: "4", name: "Juan", user_id: null },
  { id: "5", name: "Juani", user_id: null },
];

const ids = (result: (Driver | null)[]) => result.map((d) => d?.id ?? null);

describe("normalizeName", () => {
  it("saca acentos, mayúsculas y signos", () => {
    expect(normalizeName("  TOMÁS (kart 7) ")).toBe("tomas kart 7");
  });
});

describe("similarity", () => {
  it("da 1 para iguales y baja con las diferencias", () => {
    expect(similarity("benja", "benja")).toBe(1);
    expect(similarity("benja", "benjq")).toBeGreaterThan(0.7);
    expect(similarity("benja", "juan")).toBeLessThan(0.5);
  });
});

describe("matchDrivers", () => {
  it("reconoce mayúsculas, acentos, apellidos y errores de lectura", () => {
    const result = matchDrivers(
      [{ name: "TOMAS" }, { name: "SOFI" }, { name: "Benjq" }, { name: "Pérez Sofi" }],
      drivers,
    );
    // "Pérez Sofi" no se repite: Sofi ya fue usada por la segunda fila.
    expect(ids(result)).toEqual(["2", "3", "1", null]);
  });

  it("no confunde Juan con Juani", () => {
    expect(ids(matchDrivers([{ name: "JUANI" }, { name: "JUAN" }], drivers))).toEqual(["5", "4"]);
    expect(ids(matchDrivers([{ name: "JUAN" }, { name: "JUANI" }], drivers))).toEqual(["4", "5"]);
  });

  it("usa la sugerencia de la IA cuando es un piloto de la liga", () => {
    expect(ids(matchDrivers([{ name: "B. Fierro", suggested: "Benja" }], drivers))).toEqual(["1"]);
  });

  it("ignora sugerencias que no son de la liga y nombres que no se parecen a nadie", () => {
    expect(ids(matchDrivers([{ name: "Carlos", suggested: "Carlos" }, { name: "X" }], drivers))).toEqual([null, null]);
  });
});
