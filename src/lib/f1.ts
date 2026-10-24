// Datos oficiales de F1 desde la API pública de Jolpica (sucesora de Ergast).
// Next guarda las respuestas en caché, así no le pegamos a la API en cada visita.

const API = "https://api.jolpi.ca/ergast/f1";

export const COLAPINTO_ID = "colapinto";

export type F1Driver = { id: string; code: string; name: string; team: string };

/** Lo que hace falta para puntuar un prode: quién hizo la pole y el orden de llegada (ids de piloto). */
export type RaceOutcome = { pole: string | null; finish: string[] };

type ApiDriver = { driverId: string; code?: string; givenName: string; familyName: string };
type ApiResult = { position: string; Driver: ApiDriver; Constructor: { name: string } };
type ApiRace = { Results?: ApiResult[]; QualifyingResults?: { position: string; Driver: ApiDriver }[] };
type ApiResponse = { MRData: { RaceTable?: { Races: ApiRace[] }; DriverTable?: { Drivers: ApiDriver[] } } };

async function get(path: string, revalidate: number): Promise<ApiResponse | null> {
  try {
    const response = await fetch(`${API}${path}`, { next: { revalidate } });
    if (!response.ok) return null;
    return (await response.json()) as ApiResponse;
  } catch {
    return null;
  }
}

function toDriver(d: ApiDriver, team = ""): F1Driver {
  return { id: d.driverId, code: d.code ?? d.familyName.slice(0, 3).toUpperCase(), name: `${d.givenName} ${d.familyName}`, team };
}

/** Nombre para mostrar de un piloto ("max_verstappen" → "Max Verstappen" si no está en la grilla). */
export function driverName(id: string | null, grid: F1Driver[]): string {
  if (!id) return "—";
  return grid.find((d) => d.id === id)?.name ?? id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Pilotos de la grilla actual (los de la última carrera), ordenados por equipo. */
export async function getGrid(season: number): Promise<F1Driver[]> {
  const last = await get(`/${season}/last/results/`, 6 * 3600);
  const results = last?.MRData.RaceTable?.Races[0]?.Results;
  if (results?.length) {
    return results
      .map((r) => toDriver(r.Driver, r.Constructor.name))
      .sort((a, b) => a.team.localeCompare(b.team) || a.name.localeCompare(b.name));
  }
  // Antes de la primera carrera de la temporada no hay resultados: usamos la lista de pilotos.
  const drivers = await get(`/${season}/drivers/?limit=100`, 6 * 3600);
  return (drivers?.MRData.DriverTable?.Drivers ?? []).map((d) => toDriver(d)).sort((a, b) => a.name.localeCompare(b.name));
}

/** Resultado oficial de una carrera, o null si todavía no está publicado. */
export async function getOutcome(season: number, round: number): Promise<RaceOutcome | null> {
  const [race, quali] = await Promise.all([
    get(`/${season}/${round}/results/?limit=100`, 600),
    get(`/${season}/${round}/qualifying/?limit=100`, 600),
  ]);
  const results = race?.MRData.RaceTable?.Races[0]?.Results;
  if (!results?.length) return null;

  const pole = quali?.MRData.RaceTable?.Races[0]?.QualifyingResults?.find((q) => q.position === "1")?.Driver.driverId;
  return {
    pole: pole ?? null,
    finish: [...results].sort((a, b) => Number(a.position) - Number(b.position)).map((r) => r.Driver.driverId),
  };
}
