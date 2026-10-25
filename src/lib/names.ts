/**
 * Prolija un nombre leído de una planilla: "JUAN CRUZ" → "Juan Cruz", "  o'BRIEN " → "O'Brien".
 * Si ya viene con mayúsculas y minúsculas ("benjy", "McLaren"), se respeta como está.
 */
export function tidyName(name: string): string {
  const clean = name.replace(/\s+/g, " ").trim().slice(0, 40);
  if (clean !== clean.toUpperCase()) return clean;
  return clean
    .toLowerCase()
    .replace(/(^|[\s\-'.])(\p{L})/gu, (_, sep: string, letter: string) => sep + letter.toUpperCase());
}
