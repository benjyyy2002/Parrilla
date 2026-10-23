"use server";

import type { PostgrestError } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error: string | null };

function friendlyError(error: PostgrestError): string {
  if (error.code === "23505") {
    if (error.message.includes("drivers_league_name_key")) return "Ya hay un piloto con ese nombre en la liga.";
    if (error.message.includes("results_event_id_position_key")) return "Hay dos pilotos con la misma posición.";
    return "Eso ya existe.";
  }
  // Los mensajes de las funciones SQL ya están escritos para mostrarse.
  return error.message;
}

function parseNames(text: string): string[] {
  const seen = new Set<string>();
  return text
    .split(/[\n,]/)
    .map((n) => n.trim().slice(0, 40))
    .filter((n) => {
      const key = n.toLowerCase();
      if (!n || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function parsePoints(text: string): number[] | null {
  const points = text
    .split(/[\s,;-]+/)
    .filter(Boolean)
    .map(Number);
  if (points.length === 0 || points.length > 40) return null;
  if (points.some((p) => !Number.isInteger(p) || p < 0 || p > 1000)) return null;
  return points;
}

export async function createLeague(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const season = String(formData.get("season") ?? "").trim() || String(new Date().getFullYear());
  const myName = String(formData.get("my_name") ?? "").trim();
  const others = parseNames(String(formData.get("drivers") ?? "")).filter(
    (n) => n.toLowerCase() !== myName.toLowerCase(),
  );
  const points = parsePoints(String(formData.get("points") ?? ""));

  if (!name) return { error: "Ponele un nombre a la liga." };
  if (!myName) return { error: "Poné tu nombre de piloto." };
  if (!points) return { error: "Los puntos tienen que ser números separados por coma, por ejemplo 25, 18, 15." };

  const supabase = await createClient();
  const { data: league, error } = await supabase
    .from("leagues")
    .insert({ name, season, points, fastest_lap_point: formData.get("fastest_lap_point") === "on" })
    .select("id")
    .single();
  if (error) return { error: friendlyError(error) };

  const { error: claimError } = await supabase.rpc("claim_driver", { p_league_id: league.id, p_name: myName });
  if (claimError) return { error: friendlyError(claimError) };

  if (others.length > 0) {
    const { error: driversError } = await supabase
      .from("drivers")
      .insert(others.map((n) => ({ league_id: league.id, name: n })));
    if (driversError) return { error: friendlyError(driversError) };
  }

  redirect(`/ligas/${league.id}`);
}

export async function addDrivers(leagueId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const names = parseNames(String(formData.get("names") ?? ""));
  if (names.length === 0) return { error: "Escribí al menos un nombre." };

  const supabase = await createClient();
  const { error } = await supabase.from("drivers").insert(names.map((n) => ({ league_id: leagueId, name: n })));
  if (error) return { error: friendlyError(error) };

  revalidatePath(`/ligas/${leagueId}`);
  return { error: null };
}

export async function removeDriver(leagueId: string, driverId: string) {
  const supabase = await createClient();
  await supabase.from("drivers").delete().eq("id", driverId).eq("league_id", leagueId);
  revalidatePath(`/ligas/${leagueId}`);
}

export async function claimDriver(leagueId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const driverId = String(formData.get("driver_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase.rpc(
    "claim_driver",
    driverId ? { p_league_id: leagueId, p_driver_id: driverId } : { p_league_id: leagueId, p_name: name },
  );
  if (error) return { error: friendlyError(error) };

  revalidatePath(`/ligas/${leagueId}`);
  return { error: null };
}

export type EventInput = {
  name: string;
  track: string;
  heldOn: string;
  results: { driverId: string; position: number; bestLapMs: number | null }[];
};

export async function saveEvent(leagueId: string, eventId: string | null, input: EventInput): Promise<ActionState> {
  if (!input.name.trim()) return { error: "Ponele un nombre a la fecha." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.heldOn)) return { error: "Elegí el día de la fecha." };
  if (input.results.length === 0) return { error: "Cargá al menos un piloto." };

  const supabase = await createClient();
  const { data: savedId, error } = await supabase.rpc("save_event", {
    p_league_id: leagueId,
    p_event_id: eventId,
    p_name: input.name,
    p_track: input.track,
    p_held_on: input.heldOn,
    p_results: input.results.map((r) => ({
      driver_id: r.driverId,
      position: r.position,
      best_lap_ms: r.bestLapMs,
    })),
  });
  if (error) return { error: friendlyError(error) };

  revalidatePath(`/ligas/${leagueId}`);
  redirect(`/ligas/${leagueId}/fechas/${savedId}`);
}

export async function deleteEvent(leagueId: string, eventId: string) {
  const supabase = await createClient();
  await supabase.from("events").delete().eq("id", eventId).eq("league_id", leagueId);
  revalidatePath(`/ligas/${leagueId}`);
  redirect(`/ligas/${leagueId}`);
}

export async function joinLeague(code: string) {
  const supabase = await createClient();
  const { data: leagueId, error } = await supabase.rpc("join_league", { p_code: code });
  if (error) redirect(`/l/${code}?error=1`);
  redirect(`/ligas/${leagueId}`);
}
