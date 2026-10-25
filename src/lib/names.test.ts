import { describe, expect, it } from "vitest";
import { tidyName } from "./names";

describe("tidyName", () => {
  it.each([
    ["FRANCO", "Franco"],
    ["JUAN CRUZ", "Juan Cruz"],
    ["  MARÍA   JOSÉ ", "María José"],
    ["O'BRIEN", "O'Brien"],
    ["S. PEREZ", "S. Perez"],
    ["benjy", "benjy"],
    ["Juan Cruz", "Juan Cruz"],
  ])("%j → %j", (input, expected) => {
    expect(tidyName(input)).toBe(expected);
  });
});
