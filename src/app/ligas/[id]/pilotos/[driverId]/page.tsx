import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/dates";
import { driverProfile } from "@/lib/driver-profile";
import { formatLapTime } from "@/lib/laptime";
import { getMemberLeague } from "@/lib/league-data";

export async function generateMetadata({ params }: PageProps<"/ligas/[id]/pilotos/[driverId]">): Promise<Metadata> {
  const { id, driverId } = await params;
  const league = await getMemberLeague(id);
  const driver = league?.data.drivers.find((d) => d.id === driverId);
  return { title: driver?.name ?? "Piloto" };
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card flex flex-col items-center gap-0.5 p-3">
      <span className="font-display text-2xl font-bold italic tabular-nums">{value}</span>
      <span className="text-xs text-subtle">{label}</span>
    </div>
  );
}

export default async function DriverPage({ params }: PageProps<"/ligas/[id]/pilotos/[driverId]">) {
  const { id, driverId } = await params;
  const league = await getMemberLeague(id);
  if (!league) notFound();

  const profile = driverProfile(league.data, driverId);
  if (!profile) notFound();

  const { standing } = profile;
  const isMe = driverId === league.myDriverId;
  const history = [...profile.history].reverse();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-8">
      <div>
        <Link href={`/ligas/${id}`} className="back-link">
          ← {league.data.name}
        </Link>
        <h1 className="mt-2 display text-4xl leading-none">
          {profile.driver.name}
          {isMe && <span className="ml-2 align-middle text-sm font-medium not-italic text-volt">vos</span>}
        </h1>
        <p className="text-sm text-muted">
          P{profile.rank} en el campeonato · {standing.points} pts
        </p>
      </div>

      <section className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        <Stat label="Fechas" value={standing.races} />
        <Stat label="Victorias" value={standing.wins} />
        <Stat label="Podios" value={standing.podiums} />
        <Stat label="Vueltas rápidas" value={standing.fastestLaps} />
        <Stat
          label="Promedio"
          value={profile.averagePosition === null ? "—" : `P${profile.averagePosition.toFixed(1).replace(".0", "")}`}
        />
      </section>

      {profile.rivalries.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="section-title">Duelos cara a cara</h2>
          <ul className="card flex flex-col divide-y divide-line py-1">
            {profile.rivalries.map((r) => {
              const tone = r.ahead > r.behind ? "text-volt" : r.ahead < r.behind ? "text-danger" : "text-fg-2";
              return (
                <li key={r.rival.id} className="flex items-center justify-between py-2">
                  <Link href={`/ligas/${id}/pilotos/${r.rival.id}`} className="hover:underline">
                    vs {r.rival.name}
                  </Link>
                  <span className={`font-bold tabular-nums ${tone}`}>
                    {r.ahead} – {r.behind}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="text-xs text-subtle">Cuántas veces terminó adelante y atrás de cada uno, en las fechas que corrieron los dos.</p>
        </section>
      )}

      {profile.bestLapsByTrack.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="section-title">Mejores vueltas</h2>
          <ul className="card flex flex-col divide-y divide-line py-1">
            {profile.bestLapsByTrack.map((lap) => (
              <li key={lap.track} className="flex items-center justify-between py-2">
                <span>
                  {lap.track}
                  <span className="ml-2 text-xs text-subtle">{lap.eventName}</span>
                </span>
                <span className="font-bold tabular-nums">{formatLapTime(lap.bestLapMs)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="section-title">Fecha por fecha</h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted">Todavía no se corrió ninguna fecha.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {history.map((h) => (
              <li key={h.event.id}>
                <Link
                  href={`/ligas/${id}/fechas/${h.event.id}`}
                  className="card flex items-center gap-3 py-3 hover:border-volt/50"
                >
                  <span
                    className={`w-10 text-center font-display text-lg font-bold italic ${
                      h.position === null ? "text-faint" : h.position <= 3 ? "text-volt" : "text-fg-2"
                    }`}
                  >
                    {h.position === null ? "—" : `P${h.position}`}
                  </span>
                  <span className="flex-1">
                    <span className="block font-medium">{h.event.name}</span>
                    <span className="text-xs text-subtle">
                      {formatDate(h.event.held_on)}
                      {h.bestLapMs ? ` · ${formatLapTime(h.bestLapMs)}` : ""}
                      {h.fastestLap ? " ⏱" : ""}
                    </span>
                  </span>
                  <span className="text-sm font-bold tabular-nums text-fg-2">
                    {h.position === null ? "No corrió" : `+${h.points}`}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
