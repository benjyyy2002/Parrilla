"use server";

import type { PostgrestError } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PhotoReadError, readResultsPhoto } from "@/lib/ai/gemini";
import { getMemberLeague } from "@/lib/league-data";
import { matchDrivers } from "@/lib/match-drivers";
import { tidyName } from "@/lib/names";
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

export type PhotoRow = {
  /** Nombre tal como está en la planilla. */
  name: string;
  lap: string;
  /** Piloto de la liga que le corresponde, o null si no está en la liga. */
  driverId: string | null;
};

export type PhotoResult = { error: string } | { error: null; rows: PhotoRow[] };

const MAX_PHOTO_BYTES = 2.5 * 1024 * 1024;

/** Lee una foto de la planilla con IA y devuelve todas las filas, en orden de llegada. */
export async function readEventPhoto(leagueId: string, formData: FormData): Promise<PhotoResult> {
  const league = await getMemberLeague(leagueId);
  if (!league?.isAdmin) return { error: "Solo el admin de la liga puede cargar fechas." };

  const photo = formData.get("photo");
  if (!(photo instanceof File) || !photo.type.startsWith("image/")) return { error: "Elegí una foto." };
  if (photo.size > MAX_PHOTO_BYTES) return { error: "La foto es muy pesada. Probá con otra." };

  try {
    const read = await readResultsPhoto(
      { base64: Buffer.from(await photo.arrayBuffer()).toString("base64"), mimeType: photo.type },
      league.data.drivers.map((d) => d.name),
    );
    if (read.length === 0) return { error: "No encontramos resultados en la foto. Probá con una más nítida." };

    const matches = matchDrivers(read, league.data.drivers);
    return {
      error: null,
      rows: read.map((row, i) => ({
        name: row.name,
        lap: row.bestLap?.replace(",", ".") ?? "",
        driverId: matches[i]?.id ?? null,
      })),
    };
  } catch (error) {
    if (error instanceof PhotoReadError) return { error: error.message };
    console.error(error);
    return { error: "No pudimos leer la foto. Probá de nuevo o cargala a mano." };
  }
}

export type AddedDriver = { readName: string; id: string; name: string };

/** Suma a la liga a los pilotos de la planilla que no estaban. Devuelve los creados, con el nombre leído de cada uno. */
export async function addPhotoDrivers(
  leagueId: string,
  readNames: string[],
): Promise<{ error: string } | { error: null; drivers: AddedDriver[] }> {
  const league = await getMemberLeague(leagueId);
  if (!league?.isAdmin) return { error: "Solo el admin de la liga puede sumar pilotos." };

  // Sin repetir nombres, ni entre ellos ni con los pilotos que ya están en la liga.
  const taken = new Set(league.data.drivers.map((d) => d.name.toLowerCase()));
  const toCreate: { readName: string; name: string }[] = [];
  for (const readName of readNames) {
    const name = tidyName(readName);
    if (!name || taken.has(name.toLowerCase())) continue;
    taken.add(name.toLowerCase());
    toCreate.push({ readName, name });
  }
  if (toCreate.length === 0) return { error: null, drivers: [] };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("drivers")
    .insert(toCreate.map((d) => ({ league_id: leagueId, name: d.name })))
    .select("id, name");
  if (error) return { error: friendlyError(error) };

  revalidatePath(`/ligas/${leagueId}`);
  return {
    error: null,
    drivers: toCreate.flatMap((d) => {
      const created = data.find((row) => row.name === d.name);
      return created ? [{ readName: d.readName, id: created.id, name: created.name }] : [];
    }),
  };
}
