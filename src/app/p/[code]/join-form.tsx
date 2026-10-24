"use client";

import { useActionState } from "react";
import { joinProdeGroup, type ActionState } from "@/app/prode/actions";

const initialState: ActionState = { error: null };

export function JoinProdeForm({ code }: { code: string }) {
  const [state, formAction, pending] = useActionState(joinProdeGroup.bind(null, code), initialState);

  return (
    <form action={formAction} className="card flex flex-col gap-3">
      <p className="font-semibold">Sumate al grupo</p>
      <div className="flex gap-2">
        <input className="input" name="nickname" placeholder="Tu nombre en el grupo" maxLength={30} required />
        <button className="btn-primary shrink-0" disabled={pending}>
          Sumarme
        </button>
      </div>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
    </form>
  );
}
