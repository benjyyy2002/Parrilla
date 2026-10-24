import { formatLapTime } from "@/lib/laptime";
import type { EventResultRow } from "@/lib/standings";
import { podiumColors } from "./standings-table";

export function EventResultsTable({ rows }: { rows: EventResultRow[] }) {
  return (
    <>
      <div className="timing-wrap">
        <table className="timing">
          <thead>
            <tr>
              <th className="w-12 py-2.5 pl-4 text-left">Pos</th>
              <th className="py-2.5 text-left">Piloto</th>
              <th className="py-2.5 text-right">Mejor vuelta</th>
              <th className="py-2.5 pr-4 text-right">Pts</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.driver.id}>
                <td className={`py-3 pl-4 font-display text-lg font-bold italic ${podiumColors[r.position - 1] ?? "text-subtle"}`}>
                  {r.position}
                </td>
                <td className="py-3 font-medium">{r.driver.name}</td>
                <td className={`py-3 text-right font-mono tabular-nums ${r.fastestLap ? "text-fastest" : "text-fg-2"}`}>
                  {r.bestLapMs ? formatLapTime(r.bestLapMs) : "—"}
                </td>
                <td className="py-3 pr-4 text-right font-display text-lg font-bold tabular-nums text-volt">+{r.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.some((r) => r.fastestLap) && (
        <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.15em] text-subtle">
          <span className="size-2 rounded-full bg-fastest shadow-[0_0_8px_var(--color-fastest)]" /> Vuelta más rápida (+1)
        </p>
      )}
    </>
  );
}
