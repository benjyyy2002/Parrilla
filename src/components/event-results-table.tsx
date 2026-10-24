import { formatLapTime } from "@/lib/laptime";
import type { EventResultRow } from "@/lib/standings";

export function EventResultsTable({ rows }: { rows: EventResultRow[] }) {
  return (
    <>
      <div className="overflow-hidden rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 text-xs uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="w-10 py-2 pl-3 text-left">#</th>
              <th className="py-2 text-left">Piloto</th>
              <th className="py-2 text-right">Mejor vuelta</th>
              <th className="py-2 pr-3 text-right">Pts</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.driver.id} className="border-t border-zinc-800">
                <td className="py-2.5 pl-3 font-bold text-zinc-400">{r.position}</td>
                <td className="py-2.5 font-medium">{r.driver.name}</td>
                <td className="py-2.5 text-right tabular-nums text-zinc-300">
                  {r.bestLapMs ? formatLapTime(r.bestLapMs) : "—"}
                  {r.fastestLap && <span className="ml-1 text-purple-400">⏱</span>}
                </td>
                <td className="py-2.5 pr-3 text-right font-bold tabular-nums">+{r.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.some((r) => r.fastestLap) && <p className="text-xs text-zinc-500">⏱ Vuelta más rápida (+1 punto)</p>}
    </>
  );
}
