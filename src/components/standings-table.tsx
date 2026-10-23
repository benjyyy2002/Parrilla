import type { StandingRow } from "@/lib/standings";

const podiumColors = ["text-yellow-400", "text-zinc-300", "text-amber-600"];

export function StandingsTable({ rows, highlightDriverId }: { rows: StandingRow[]; highlightDriverId?: string | null }) {
  if (rows.length === 0) {
    return <p className="text-sm text-zinc-400">Todavía no hay pilotos en la liga.</p>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800">
      <table className="w-full text-sm">
        <thead className="bg-zinc-900 text-xs uppercase tracking-wider text-zinc-500">
          <tr>
            <th className="w-10 py-2 pl-3 text-left">#</th>
            <th className="py-2 text-left">Piloto</th>
            <th className="py-2 text-center" title="Victorias">
              V
            </th>
            <th className="py-2 text-center" title="Podios">
              P
            </th>
            <th className="py-2 text-center" title="Vueltas rápidas">
              VR
            </th>
            <th className="py-2 pr-3 text-right">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.driver.id}
              className={`border-t border-zinc-800 ${row.driver.id === highlightDriverId ? "bg-red-950/40" : ""}`}
            >
              <td className={`py-2.5 pl-3 font-bold ${podiumColors[i] ?? "text-zinc-500"}`}>{i + 1}</td>
              <td className="py-2.5 font-medium">
                {row.driver.name}
                <span className="ml-2 text-xs text-zinc-500">
                  {row.races} {row.races === 1 ? "fecha" : "fechas"}
                </span>
              </td>
              <td className="py-2.5 text-center text-zinc-400">{row.wins}</td>
              <td className="py-2.5 text-center text-zinc-400">{row.podiums}</td>
              <td className="py-2.5 text-center text-zinc-400">{row.fastestLaps}</td>
              <td className="py-2.5 pr-3 text-right text-base font-bold tabular-nums">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
