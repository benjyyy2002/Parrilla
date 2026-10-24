/** Marca de Parrilla: tres franjas de velocidad + nombre en itálica. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 30 20" className="h-4 w-6" aria-hidden="true">
        <path d="M7 0h8L8 20H0z" className="fill-volt" />
        <path d="M17 0h5l-7 20h-5z" className="fill-cyan" />
        <path d="M24 0h5l-7 20h-5z" className="fill-fg/50" />
      </svg>
      <span className="font-display text-lg font-bold uppercase italic tracking-wide">Parrilla</span>
    </span>
  );
}
