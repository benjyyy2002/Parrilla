// Relaciona los nombres que lee la IA en la planilla ("B. FIERRO", "benja", "Benjamín")
// con los pilotos de la liga. Cada piloto se usa una sola vez.

import type { Driver } from "./types";

export function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = temp;
    }
  }
  return prev[b.length];
}

/** 1 = iguales, 0 = nada que ver. */
export function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  return 1 - levenshtein(a, b) / Math.max(a.length, b.length);
}

/** Qué tan bien coincide lo leído con un piloto: por nombre completo, por alguna palabra o por parecido. */
function score(read: string, driver: string): number {
  if (read === driver) return 1;
  const readWords = read.split(" ");
  const driverWords = driver.split(" ");
  if (readWords.includes(driver) || driverWords.includes(read)) return 0.95;
  if (readWords.some((w) => w.length >= 3 && driverWords.includes(w))) return 0.9;
  const best = Math.max(similarity(read, driver), ...readWords.map((w) => similarity(w, driver)));
  return best;
}

const MIN_SCORE = 0.72;

export type ReadName = {
  name: string;
  /** Piloto que sugirió la IA (de la lista que le pasamos), si sugirió alguno. */
  suggested?: string | null;
};

/** Devuelve, para cada nombre leído, el piloto de la liga que le corresponde (o null). */
export function matchDrivers(reads: ReadName[], drivers: Driver[]): (Driver | null)[] {
  const used = new Set<string>();
  const normalized = drivers.map((d) => ({ driver: d, key: normalizeName(d.name) }));

  return reads.map((read) => {
    const available = normalized.filter((d) => !used.has(d.driver.id));

    // 1) La sugerencia de la IA, si es exactamente uno de los pilotos.
    const suggested = read.suggested ? normalizeName(read.suggested) : "";
    let pick = suggested ? available.find((d) => d.key === suggested) : undefined;

    // 2) Si no, el piloto que mejor coincide con lo que dice la planilla.
    if (!pick) {
      const key = normalizeName(read.name);
      let bestScore = 0;
      for (const d of available) {
        const s = score(key, d.key);
        if (s > bestScore) {
          bestScore = s;
          pick = d;
        }
      }
      if (bestScore < MIN_SCORE) pick = undefined;
    }

    if (!pick) return null;
    used.add(pick.driver.id);
    return pick.driver;
  });
}
