// Palabras que van en minúscula en el medio de un nombre: "Juan de la Cruz", "Kartódromo de Buenos Aires".
const LOWERCASE_WORDS = new Set(["de", "del", "la", "las", "los", "el", "y", "e"]);

/**
 * Prolija un nombre leído de una planilla: "JUAN CRUZ" → "Juan Cruz", "o'BRIEN" → "O'Brien",
 * "KARTODROMO DE BUENOS AIRES" → "Kartodromo de Buenos Aires".
 * Si ya viene con mayúsculas y minúsculas ("benjy", "McLaren"), se respeta como está.
 */
export function tidyName(name: string, maxLength = 40): string {
  const clean = name.replace(/\s+/g, " ").trim().slice(0, maxLength);
  if (clean !== clean.toUpperCase()) return clean;
  return clean
    .toLowerCase()
    .split(" ")
    .map((word, i) =>
      i > 0 && LOWERCASE_WORDS.has(word)
        ? word
        : word.replace(/(^|[\-'.])(\p{L})/gu, (_, sep: string, letter: string) => sep + letter.toUpperCase()),
    )
    .join(" ");
}
