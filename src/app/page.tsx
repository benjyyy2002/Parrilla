import Link from "next/link";
import { StartLights } from "@/components/start-lights";

const features = [
  {
    n: "01",
    title: "Cargás la fecha en un minuto",
    text: "Tocás a los pilotos en el orden en que llegaron. La vuelta rápida es opcional.",
  },
  {
    n: "02",
    title: "La tabla se arma sola",
    text: "Puntos estilo F1 (o los tuyos), victorias, podios, vuelta rápida y duelos cara a cara.",
  },
  {
    n: "03",
    title: "Un link para todo el grupo",
    text: "Lo mandás por WhatsApp y llega con la tabla en la vista previa. Se ve sin registrarse.",
  },
];

// Tabla de ejemplo para mostrar cómo se ve el producto.
const demo = [
  { pos: 1, name: "Sofi", pts: 68, gap: "", color: "text-gold" },
  { pos: 2, name: "Tomi", pts: 61, gap: "−7", color: "text-silver", fastest: true },
  { pos: 3, name: "Juan", pts: 54, gap: "−14", color: "text-bronze" },
  { pos: 4, name: "Benja", pts: 50, gap: "−18", color: "text-subtle", me: true },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-14 px-4 pt-12 pb-6">
      <section className="flex flex-col gap-6">
        <StartLights />
        <p className="section-title">Liga de karting + prode de F1</p>
        <h1 className="display text-5xl leading-[0.92] sm:text-7xl">
          Tu liga de karting,
          <br />
          <span className="bg-gradient-to-r from-volt via-volt-soft to-cyan bg-clip-text pr-2 text-transparent">
            como la F1.
          </span>
        </h1>
        <p className="max-w-md text-lg text-muted">
          Se terminaron las discusiones de quién es el más rápido. Cargás cada fecha y el campeonato se arma solo.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/ligas" className="btn-primary px-7 py-3.5 text-base">
            Crear mi liga →
          </Link>
          <Link href="/prode" className="btn-secondary px-7 py-3.5 text-base">
            Jugar al prode
          </Link>
        </div>
      </section>

      {/* Vista previa tipo torre de tiempos */}
      <section>
        <div className="timing-wrap shadow-[0_0_60px_-20px_rgb(200_255_46/0.35)]">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-subtle">Liga de los jueves · Fecha 6</span>
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-volt">
              <span className="size-1.5 animate-pulse rounded-full bg-volt" /> En vivo
            </span>
          </div>
          <table className="timing">
            <tbody>
              {demo.map((d) => (
                <tr key={d.pos} className={d.me ? "me-row" : ""}>
                  <td className={`w-12 py-3 pl-4 font-display text-lg font-bold italic ${d.color}`}>{d.pos}</td>
                  <td className="py-3 font-medium">
                    {d.name}
                    {d.fastest && (
                      <span className="ml-2 rounded-sm bg-fastest/15 px-1.5 py-0.5 font-mono text-[10px] text-fastest">VR</span>
                    )}
                  </td>
                  <td className="py-3 text-right font-mono text-xs text-subtle">{d.gap}</td>
                  <td className="py-3 pr-4 text-right font-display text-xl font-bold tabular-nums">{d.pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {features.map((f) => (
          <div key={f.n} className="card">
            <span className="font-mono text-xs text-volt">{f.n}</span>
            <h2 className="mt-2 font-display text-lg font-semibold leading-tight">{f.title}</h2>
            <p className="mt-2 text-sm text-muted">{f.text}</p>
          </div>
        ))}
      </section>

      <section className="relative overflow-hidden rounded-2xl border border-cyan/30 bg-panel/80 p-6">
        <div className="pointer-events-none absolute -top-20 -right-10 size-64 rounded-full bg-cyan/15 blur-3xl" />
        <div className="relative flex flex-col gap-3">
          <p className="section-title">Prode F1</p>
          <h2 className="display text-3xl leading-none">Entre fecha y fecha, pronosticá la F1.</h2>
          <p className="max-w-md text-sm text-muted">
            Pole, podio y en qué puesto termina Colapinto. Armá un grupo con tu familia o tus amigos: los puntos se
            calculan solos con el resultado oficial.
          </p>
          <div>
            <Link href="/prode" className="btn-secondary">
              Armar mi grupo
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
