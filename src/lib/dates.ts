/** "2026-11-08" → "8 nov 2026" (sin problemas de zona horaria). */
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${day} ${months[month - 1]} ${year}`;
}

/** Fecha de hoy en Argentina, en formato YYYY-MM-DD. */
export function todayInArgentina(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).format(new Date());
}
