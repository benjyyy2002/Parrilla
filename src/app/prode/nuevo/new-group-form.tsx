"use client";

import { useActionState } from "react";
import { createProdeGroup, type ActionState } from "../actions";

const initialState: ActionState = { error: null };

export function NewGroupForm() {
  const [state, formAction, pending] = useActionState(createProdeGroup, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <label className="flex flex-col gap-1 text-sm">
        Nombre del grupo
        <input className="input" name="name" placeholder="Ej: Familia Fierro" maxLength={60} required />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Tu nombre en el grupo
        <input className="input" name="nickname" placeholder="Como te van a ver en la tabla" maxLength={30} required />
      </label>
      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
      <button className="btn-primary py-3" disabled={pending}>
        {pending ? "Creando…" : "Crear grupo"}
      </button>
    </form>
  );
}
