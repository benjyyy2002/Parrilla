"use client";

import { useActionState, useEffect, useRef } from "react";
import type { Driver } from "@/lib/types";
import { addDrivers, claimDriver, type ActionState } from "../actions";

const initialState: ActionState = { error: null };

export function AddDriversForm({ leagueId }: { leagueId: string }) {
  const [state, formAction, pending] = useActionState(addDrivers.bind(null, leagueId), initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!pending && state.error === null) formRef.current?.reset();
  }, [pending, state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input className="input" name="names" placeholder="Nombre (o varios separados por coma)" />
        <button className="btn-secondary shrink-0" disabled={pending}>
          Agregar
        </button>
      </div>
      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
    </form>
  );
}

export function ClaimDriverForm({ leagueId, freeDrivers }: { leagueId: string; freeDrivers: Driver[] }) {
  const [state, formAction, pending] = useActionState(claimDriver.bind(null, leagueId), initialState);

  return (
    <section className="card flex flex-col gap-3 border-red-900/60">
      <p className="font-semibold">¿Cuál de estos sos vos?</p>
      {freeDrivers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {freeDrivers.map((driver) => (
            <form key={driver.id} action={formAction}>
              <input type="hidden" name="driver_id" value={driver.id} />
              <button className="btn-secondary py-1.5 text-sm" disabled={pending}>
                {driver.name}
              </button>
            </form>
          ))}
        </div>
      )}
      <form action={formAction} className="flex gap-2">
        <input
          className="input"
          name="name"
          placeholder={freeDrivers.length > 0 ? "No estoy: agregarme como…" : "Tu nombre de piloto"}
          maxLength={40}
          required
        />
        <button className="btn-primary shrink-0" disabled={pending}>
          Sumarme
        </button>
      </form>
      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
    </section>
  );
}
