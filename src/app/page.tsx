import Link from "next/link";

const features = [
  {
    title: "Cargás la fecha en un minuto",
    text: "Tocás a los pilotos en el orden en que llegaron y listo. La vuelta rápida es opcional.",
  },
  {
    title: "La tabla se arma sola",
    text: "Puntos estilo F1 (o los que quieras), victorias, podios y vuelta rápida.",
  },
  {
    title: "Un link para todo el grupo",
    text: "Lo mandás al grupo de WhatsApp y cualquiera ve la tabla, sin registrarse.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-4 py-14">
      <section className="flex flex-col gap-5">
        <p className="section-title">Liga de karting entre amigos</p>
        <h1 className="text-4xl font-black italic leading-tight tracking-tight sm:text-5xl">
          Tu liga de karting,
          <br />
          <span className="text-red-500">como la F1.</span>
        </h1>
        <p className="max-w-md text-lg text-zinc-400">
          Se terminaron las discusiones de quién es el más rápido. Cargás cada fecha y el campeonato se arma solo.
        </p>
        <div>
          <Link href="/ligas" className="btn-primary px-6 py-3 text-lg">
            Crear mi liga
          </Link>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="card">
            <h2 className="font-semibold">{f.title}</h2>
            <p className="mt-1 text-sm text-zinc-400">{f.text}</p>
          </div>
        ))}
      </section>

      <section className="card flex flex-col gap-3 border-red-900/60">
        <p className="section-title">Nuevo · Prode F1</p>
        <h2 className="text-2xl font-black italic">Entre fecha y fecha, pronosticá la F1.</h2>
        <p className="text-sm text-zinc-400">
          Pole, podio y en qué puesto termina Colapinto. Armá un grupo con tu familia o tus amigos: los puntos se calculan
          solos con el resultado oficial.
        </p>
        <div>
          <Link href="/prode" className="btn-secondary">
            Jugar al prode
          </Link>
        </div>
      </section>
    </main>
  );
}
