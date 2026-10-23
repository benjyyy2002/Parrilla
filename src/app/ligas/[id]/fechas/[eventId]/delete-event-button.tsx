"use client";

import { deleteEvent } from "../../../actions";

export function DeleteEventButton({ leagueId, eventId }: { leagueId: string; eventId: string }) {
  return (
    <form
      action={deleteEvent.bind(null, leagueId, eventId)}
      onSubmit={(e) => {
        if (!confirm("¿Borrar esta fecha y sus resultados?")) e.preventDefault();
      }}
    >
      <button className="btn-secondary text-red-400">Borrar</button>
    </form>
  );
}
