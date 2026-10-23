/**
 * Convierte un tiempo de vuelta escrito a mano en milisegundos.
 * Acepta "45.123", "45,123", "1:02.5" o "1:02,500". Devuelve null si no se entiende.
 */
export function parseLapTime(input: string): number | null {
  const text = input.trim().replace(",", ".");
  if (text === "") return null;

  const match = /^(?:(\d{1,2}):)?(\d{1,2}(?:\.\d{1,3})?)$/.exec(text);
  if (!match) return null;

  const minutes = match[1] ? Number(match[1]) : 0;
  const seconds = Number(match[2]);
  if (match[1] && seconds >= 60) return null;

  const ms = Math.round((minutes * 60 + seconds) * 1000);
  return ms > 0 ? ms : null;
}

/** 62500 → "1:02.500", 45123 → "45.123" */
export function formatLapTime(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(3);
  if (minutes === 0) return seconds;
  return `${minutes}:${seconds.padStart(6, "0")}`;
}
