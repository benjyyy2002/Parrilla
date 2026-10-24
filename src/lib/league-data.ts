import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import type { LeagueData, LeagueEvent, Result } from "@/lib/types";

type EventRow = LeagueEvent & { created_at: string; results: Result[] };

/**
 * Liga completa para un miembro (respeta RLS). Devuelve null si no existe o no sos miembro.
 * Con `cache`, generateMetadata y la página comparten una sola consulta por request.
 */
export const getMemberLeague = cache(async (leagueId: string) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: league }, { data: membership }] = await Promise.all([
    supabase
      .from("leagues")
      .select(
        "id, name, season, points, fastest_lap_point, invite_code, drivers(id, name, user_id), events(id, name, track, held_on, created_at, results(event_id, driver_id, position, best_lap_ms))",
      )
      .eq("id", leagueId)
      .maybeSingle(),
    supabase.from("league_members").select("role").eq("league_id", leagueId).eq("user_id", user.id).maybeSingle(),
  ]);

  if (!league) return null;

  // Mismo orden que la vista pública: por día y, si hay dos el mismo día, por cuál se cargó primero.
  const events = (league.events as EventRow[]).sort(
    (a, b) => a.held_on.localeCompare(b.held_on) || a.created_at.localeCompare(b.created_at),
  );
  const data: LeagueData = {
    id: league.id,
    name: league.name,
    season: league.season,
    points: league.points,
    fastest_lap_point: league.fastest_lap_point,
    invite_code: league.invite_code,
    drivers: league.drivers.sort((a, b) => a.name.localeCompare(b.name, "es")),
    events: events.map((e) => ({ id: e.id, name: e.name, track: e.track, held_on: e.held_on })),
    results: events.flatMap((e) => e.results),
  };

  return {
    data,
    isAdmin: membership?.role === "admin",
    myDriverId: data.drivers.find((d) => d.user_id === user.id)?.id ?? null,
  };
});

/** Liga por código de invitación, para el link público (sin iniciar sesión). */
export const getPublicLeague = cache(async (code: string): Promise<LeagueData | null> => {
  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("public_league", { p_code: code });
  if (error || !data) return null;
  return data as LeagueData;
});
