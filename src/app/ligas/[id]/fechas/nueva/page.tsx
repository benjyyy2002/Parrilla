import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { todayInArgentina } from "@/lib/dates";
import { getMemberLeague } from "@/lib/league-data";
import { EventForm } from "../event-form";

export const metadata: Metadata = { title: "Cargar fecha" };

export default async function NewEventPage({ params }: PageProps<"/ligas/[id]/fechas/nueva">) {
  const { id } = await params;
  const league = await getMemberLeague(id);
  if (!league || !league.isAdmin) notFound();

  const { data } = league;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
      <div>
        <Link href={`/ligas/${data.id}`} className="back-link">
          ← {data.name}
        </Link>
        <h1 className="mt-2 display text-3xl leading-none">Cargar fecha</h1>
      </div>
      <EventForm
        leagueId={data.id}
        eventId={null}
        drivers={data.drivers}
        initial={{ name: `Fecha ${data.events.length + 1}`, track: "", heldOn: todayInArgentina(), results: [] }}
      />
    </main>
  );
}
