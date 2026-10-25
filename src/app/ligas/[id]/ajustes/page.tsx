import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMemberLeague } from "@/lib/league-data";
import { DeleteLeagueForm, DriversForm, LeagueSettingsForm } from "./settings-forms";

export const metadata: Metadata = { title: "Ajustes de la liga" };

export default async function LeagueSettingsPage({ params }: PageProps<"/ligas/[id]/ajustes">) {
  const { id } = await params;
  const league = await getMemberLeague(id);
  if (!league || !league.isAdmin) notFound();

  const { data, isOwner } = league;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-8">
      <div>
        <Link href={`/ligas/${data.id}`} className="back-link">
          ← {data.name}
        </Link>
        <h1 className="mt-2 display text-3xl leading-none">Ajustes</h1>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="section-title">Liga</h2>
        <LeagueSettingsForm
          leagueId={data.id}
          initial={{
            name: data.name,
            season: data.season,
            points: data.points.join(", "),
            fastestLapPoint: data.fastest_lap_point,
          }}
        />
      </section>

      {data.drivers.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="section-title">Pilotos</h2>
          <DriversForm leagueId={data.id} drivers={data.drivers} />
        </section>
      )}

      {isOwner && (
        <section className="flex flex-col gap-3">
          <h2 className="section-title">Zona peligrosa</h2>
          <DeleteLeagueForm leagueId={data.id} leagueName={data.name} eventsCount={data.events.length} />
        </section>
      )}
    </main>
  );
}
