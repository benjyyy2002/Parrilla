import { describe, expect, it } from "vitest";
import { formatLapTime, parseLapTime } from "./laptime";

describe("parseLapTime", () => {
  it.each([
    ["45.123", 45123],
    ["45,123", 45123],
    ["45", 45000],
    ["1:02.5", 62500],
    ["1:02,500", 62500],
    [" 59.9 ", 59900],
  ])("%s → %d ms", (input, expected) => {
    expect(parseLapTime(input)).toBe(expected);
  });

  it.each(["", "abc", "1:75.000", "0", "1.2.3"])("rechaza %j", (input) => {
    expect(parseLapTime(input)).toBeNull();
  });
});

describe("formatLapTime", () => {
  it("formatea con y sin minutos", () => {
    expect(formatLapTime(45123)).toBe("45.123");
    expect(formatLapTime(62500)).toBe("1:02.500");
    expect(formatLapTime(605000)).toBe("10:05.000");
  });
});
