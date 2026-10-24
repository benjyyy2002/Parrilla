import { formatRaceTime, isLocked, type ProdeRace } from "@/lib/prode-data";

/** Tarjeta de la próxima carrera del prode: número de fecha, nombre y cuándo cierra. */
export function RaceBanner({ race, children }: { race: ProdeRace; children?: React.ReactNode }) {
  const locked = isLocked(race);
  return (
    <section className="relative overflow-hidden rounded-2xl border border-line bg-panel/80 p-5">
      {/* Brillo de color en la esquina */}
      <div className="pointer-events-none absolute -top-24 -right-16 size-56 rounded-full bg-cyan/15 blur-3xl" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="section-title">Fecha {race.round} · {race.season}</p>
          <p className="display mt-2 text-3xl leading-none">{race.name}</p>
          {race.circuit && <p className="mt-1 text-sm text-muted">{race.circuit}</p>}
        </div>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] ${
            locked ? "border-danger/40 text-danger" : "border-volt/40 text-volt"
          }`}
        >
          {locked ? "Cerrado" : "Abierto"}
        </span>
      </div>
      <div className="relative mt-4 flex items-baseline gap-2 border-t border-line pt-3 font-mono text-xs uppercase tracking-[0.15em]">
        <span className="text-subtle">{locked ? "Largada" : "Cierra"}</span>
        <span className="text-fg">{formatRaceTime(locked ? race.race_at : race.quali_at)}</span>
      </div>
      {children && <div className="relative mt-4 flex flex-col gap-3">{children}</div>}
    </section>
  );
}
