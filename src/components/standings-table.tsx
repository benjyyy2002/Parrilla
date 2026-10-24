import Link from "next/link";
import type { StandingRow } from "@/lib/standings";

export const podiumColors = ["text-gold", "text-silver", "text-bronze"];

/** Tabla del campeonato con estilo de torre de tiempos. */
export function StandingsTable({
  rows,
  highlightDriverId,
  driverHrefPrefix,
}: {
  rows: StandingRow[];
  highlightDriverId?: string | null;
  /** Si viene, cada nombre linkea a `${driverHrefPrefix}${driver.id}`. */
  driverHrefPrefix?: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted">Todavía no hay pilotos en la liga.</p>;
  }

  const leader = rows[0]?.points ?? 0;

  return (
    <div className="timing-wrap">
      <table className="timing">
        <thead>
          <tr>
            <th className="w-12 py-2.5 pl-4 text-left">Pos</th>
            <th className="py-2.5 text-left">Piloto</th>
            <th className="hidden py-2.5 text-center sm:table-cell" title="Victorias">
              Vic
            </th>
            <th className="py-2.5 text-center" title="Podios">
              Pod
            </th>
            <th className="py-2.5 text-center" title="Vueltas rápidas">
              VR
            </th>
            <th className="py-2.5 pr-4 text-right">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.driver.id} className={row.driver.id === highlightDriverId ? "me-row" : ""}>
              <td className={`py-3 pl-4 font-display text-lg font-bold italic ${podiumColors[i] ?? "text-subtle"}`}>
                {i + 1}
              </td>
              <td className="py-3">
                {driverHrefPrefix ? (
                  <Link href={`${driverHrefPrefix}${row.driver.id}`} className="font-medium hover:text-volt">
                    {row.driver.name}
                  </Link>
                ) : (
                  <span className="font-medium">{row.driver.name}</span>
                )}
                <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.15em] text-subtle">
                  {row.races} {row.races === 1 ? "fecha" : "fechas"}
                  {i > 0 && leader > row.points ? ` · −${leader - row.points}` : ""}
                </span>
              </td>
              <td className="hidden py-3 text-center font-mono text-muted sm:table-cell">{row.wins}</td>
              <td className="py-3 text-center font-mono text-muted">{row.podiums}</td>
              <td className={`py-3 text-center font-mono ${row.fastestLaps ? "text-fastest" : "text-muted"}`}>
                {row.fastestLaps}
              </td>
              <td className="py-3 pr-4 text-right font-display text-xl font-bold tabular-nums">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
