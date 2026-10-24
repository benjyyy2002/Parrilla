"use server";

import type { PostgrestError } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error: string | null };

function friendlyError(error: PostgrestError): string {
  if (error.code === "23505" && error.message.includes("prode_members_nickname_key")) {
    return "Ya hay alguien con ese nombre en el grupo. Probá con otro.";
  }
  if (error.code === "42501") return "La carrera ya cerró: los pronósticos se cierran cuando empieza la clasificación.";
  return error.message;
}

export async function createProdeGroup(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const nickname = String(formData.get("nickname") ?? "").trim();
  if (!name) return { error: "Ponele un nombre al grupo." };

  const supabase = await createClient();
  const { data: groupId, error } = await supabase.rpc("create_prode_group", { p_name: name, p_nickname: nickname });
  if (error) return { error: friendlyError(error) };

  const { data: group } = await supabase.from("prode_groups").select("invite_code").eq("id", groupId).single();
  redirect(`/p/${group?.invite_code}`);
}

export async function joinProdeGroup(code: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const nickname = String(formData.get("nickname") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase.rpc("join_prode_group", { p_code: code, p_nickname: nickname });
  if (error) return { error: friendlyError(error) };

  revalidatePath(`/p/${code}`);
  return { error: null };
}

export type PredictionInput = {
  pole: string;
  p1: string;
  p2: string;
  p3: string;
  colapintoPosition: string;
};

export async function savePrediction(season: number, round: number, input: PredictionInput): Promise<ActionState> {
  const clean = (v: string) => (/^[a-z0-9_]{2,40}$/.test(v) ? v : null);
  const p1 = clean(input.p1);
  const p2 = clean(input.p2);
  const p3 = clean(input.p3);
  const podium = [p1, p2, p3].filter(Boolean);
  if (new Set(podium).size !== podium.length) return { error: "No podés poner al mismo piloto dos veces en el podio." };

  const colapinto = Number(input.colapintoPosition);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Necesitás iniciar sesión." };

  const { error } = await supabase.from("prode_predictions").upsert({
    user_id: user.id,
    season,
    round,
    pole: clean(input.pole),
    p1,
    p2,
    p3,
    colapinto_position: Number.isInteger(colapinto) && colapinto >= 1 && colapinto <= 30 ? colapinto : null,
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: friendlyError(error) };

  revalidatePath("/prode");
  return { error: null };
}
