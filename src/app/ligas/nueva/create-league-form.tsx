"use client";

import { useActionState } from "react";
import { F1_POINTS } from "@/lib/types";
import { createLeague, type ActionState } from "../actions";

const initialState: ActionState = { error: null };

export function CreateLeagueForm({ defaultSeason }: { defaultSeason: string }) {
  const [state, formAction, pending] = useActionState(createLeague, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <label className="flex flex-col gap-1 text-sm">
        Nombre de la liga
        <input className="input" name="name" placeholder="Ej: Liga de los jueves" maxLength={80} required />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Temporada
        <input className="input" name="season" defaultValue={defaultSeason} maxLength={40} />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Tu nombre de piloto
        <input className="input" name="my_name" placeholder="Como te van a ver en la tabla" maxLength={40} required />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Los demás pilotos <span className="text-zinc-500">(uno por línea, opcional)</span>
        <textarea className="input min-h-28" name="drivers" placeholder={"Juan\nSofi\nTomi"} />
        <span className="text-xs text-zinc-500">
          No necesitan cuenta. Cuando entren con el link, cada uno elige cuál es.
        </span>
      </label>

      <details className="card">
        <summary className="cursor-pointer text-sm font-medium">Puntos</summary>
        <div className="mt-3 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Puntos por posición (del 1º en adelante)
            <input className="input" name="points" defaultValue={F1_POINTS.join(", ")} />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="fastest_lap_point" defaultChecked className="size-4 accent-red-600" />
            +1 punto para la vuelta más rápida de cada fecha
          </label>
        </div>
      </details>

      {state.error && <p className="text-sm text-red-400">{state.error}</p>}

      <button className="btn-primary py-3" disabled={pending}>
        {pending ? "Creando…" : "Crear liga"}
      </button>
    </form>
  );
}
