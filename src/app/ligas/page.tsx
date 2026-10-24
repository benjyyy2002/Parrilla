import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Mis ligas" };

export default async function LeaguesPage() {
  const supabase = await createClient();
  const { data: leagues } = await supabase
    .from("leagues")
    .select("id, name, season, drivers(count), events(count)")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="display text-3xl leading-none">Mis ligas</h1>
        <Link href="/ligas/nueva" className="btn-primary">
          + Nueva liga
        </Link>
      </div>

      {!leagues || leagues.length === 0 ? (
        <div className="card flex flex-col items-start gap-3">
          <p className="text-fg-2">Todavía no estás en ninguna liga.</p>
          <p className="text-sm text-muted">
            Creá una para tu grupo, o pedile a un amigo el link de la suya.
          </p>
          <Link href="/ligas/nueva" className="btn-primary">
            Crear mi primera liga
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {leagues.map((league) => (
            <li key={league.id}>
              <Link href={`/ligas/${league.id}`} className="card flex items-center justify-between hover:border-volt/50">
                <div>
                  <p className="font-semibold">{league.name}</p>
                  <p className="text-sm text-muted">
                    Temporada {league.season} · {league.drivers[0]?.count ?? 0} pilotos · {league.events[0]?.count ?? 0}{" "}
                    fechas
                  </p>
                </div>
                <span className="text-subtle">→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
