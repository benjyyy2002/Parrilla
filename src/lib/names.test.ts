import { describe, expect, it } from "vitest";
import { tidyName } from "./names";

describe("tidyName", () => {
  it.each([
    ["FRANCO", "Franco"],
    ["JUAN CRUZ", "Juan Cruz"],
    ["  MARÍA   JOSÉ ", "María José"],
    ["O'BRIEN", "O'Brien"],
    ["S. PEREZ", "S. Perez"],
    ["JUAN DE LA CRUZ", "Juan de la Cruz"],
    ["KARTODROMO DE BUENOS AIRES", "Kartodromo de Buenos Aires"],
    ["DE LUCA", "De Luca"],
    ["SPEED PARK", "Speed Park"],
    ["benjy", "benjy"],
    ["Juan Cruz", "Juan Cruz"],
  ])("%j → %j", (input, expected) => {
    expect(tidyName(input)).toBe(expected);
  });
});
