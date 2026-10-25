"use client";

import { useActionState, useState } from "react";
import type { Driver } from "@/lib/types";
import { deleteLeague, renameDrivers, updateLeague, type SettingsState } from "../../actions";

const initialState: SettingsState = { error: null };

function Feedback({ state, pending }: { state: SettingsState; pending: boolean }) {
  if (pending) return null;
  if (state.error) return <p className="text-sm text-danger">{state.error}</p>;
  if (state.saved) return <p className="font-mono text-xs uppercase tracking-[0.15em] text-volt">✓ Guardado</p>;
  return null;
}

export function LeagueSettingsForm({
  leagueId,
  initial,
}: {
  leagueId: string;
  initial: { name: string; season: string; points: string; fastestLapPoint: boolean };
}) {
  const [state, formAction, pending] = useActionState(updateLeague.bind(null, leagueId), initialState);

  return (
    <form action={formAction} className="card flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Nombre
        <input className="input" name="name" defaultValue={initial.name} maxLength={80} required />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Temporada
        <input className="input" name="season" defaultValue={initial.season} maxLength={40} required />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Puntos por posición (del 1º en adelante)
        <input className="input" name="points" defaultValue={initial.points} required />
        <span className="text-xs text-subtle">Si los cambiás, la tabla se recalcula con todas las fechas ya corridas.</span>
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="fastest_lap_point"
          defaultChecked={initial.fastestLapPoint}
          className="size-4 accent-volt"
        />
        +1 punto para la vuelta más rápida de cada fecha
      </label>
      <Feedback state={state} pending={pending} />
      <button className="btn-primary" disabled={pending}>
        {pending ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}

export function DriversForm({ leagueId, drivers }: { leagueId: string; drivers: Driver[] }) {
  const [state, formAction, pending] = useActionState(renameDrivers.bind(null, leagueId), initialState);

  return (
    <form action={formAction} className="card flex flex-col gap-3">
      <p className="text-sm text-muted">Cambiá cómo aparece cada piloto en la tabla. Los resultados no se pierden.</p>
      <div className="flex flex-col gap-2">
        {drivers.map((driver) => (
          <input
            key={driver.id}
            className="input"
            name={`driver:${driver.id}`}
            defaultValue={driver.name}
            maxLength={40}
            aria-label={`Nombre de ${driver.name}`}
            required
          />
        ))}
      </div>
      <Feedback state={state} pending={pending} />
      <button className="btn-secondary" disabled={pending}>
        {pending ? "Guardando…" : "Guardar nombres"}
      </button>
    </form>
  );
}

export function DeleteLeagueForm({
  leagueId,
  leagueName,
  eventsCount,
}: {
  leagueId: string;
  leagueName: string;
  eventsCount: number;
}) {
  const [state, formAction, pending] = useActionState(deleteLeague.bind(null, leagueId), initialState);
  const [confirm, setConfirm] = useState("");
  const matches = confirm.trim().toLowerCase() === leagueName.trim().toLowerCase();

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-2xl border border-danger/40 bg-danger/5 p-4">
      <div>
        <p className="font-display font-bold uppercase tracking-wide text-danger">Borrar la liga</p>
        <p className="mt-1 text-sm text-muted">
          Se borran la liga, sus pilotos y {eventsCount === 1 ? "su fecha" : `sus ${eventsCount} fechas`} con todos los
          resultados. <strong className="text-fg-2">No se puede deshacer.</strong>
        </p>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        Para confirmar, escribí <strong className="text-fg">{leagueName}</strong>
        <input
          className="input"
          name="confirm"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="off"
        />
      </label>
      {state.error && !pending && <p className="text-sm text-danger">{state.error}</p>}
      <button
        className="inline-flex items-center justify-center rounded-lg bg-danger px-4 py-2.5 font-display text-sm font-bold uppercase tracking-[0.12em] text-ink transition-opacity disabled:opacity-30"
        disabled={!matches || pending}
      >
        {pending ? "Borrando…" : "Borrar la liga para siempre"}
      </button>
    </form>
  );
}
