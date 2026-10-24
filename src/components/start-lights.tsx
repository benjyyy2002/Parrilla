/** Semáforo de largada animado: cinco luces que se prenden en rojo y se apagan todas juntas. */
export function StartLights() {
  return (
    <div className="flex items-center gap-3" aria-hidden="true">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex flex-col gap-1 rounded-md border border-line bg-panel p-1">
            <span className="block size-3 rounded-full bg-panel-2" />
            <span
              className="start-light block size-3 rounded-full bg-panel-2"
              style={{ animation: `light-${i} 5s infinite` }}
            />
          </div>
        ))}
      </div>
      <span
        className="start-go font-mono text-[11px] font-semibold uppercase tracking-[0.3em] text-volt"
        style={{ animation: "go 5s infinite" }}
      >
        Largada
      </span>
    </div>
  );
}
