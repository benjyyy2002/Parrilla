"use client";

import { useState, useTransition } from "react";
import { formatLapTime, parseLapTime } from "@/lib/laptime";
import type { Driver } from "@/lib/types";
import { saveEvent, type EventInput } from "../../actions";
import { PhotoImport } from "./photo-import";

type Row = { driverId: string; lap: string };

export type EventFormInitial = {
  name: string;
  track: string;
  heldOn: string;
  results: { driverId: string; bestLapMs: number | null }[];
};

export function EventForm({
  leagueId,
  eventId,
  drivers,
  initial,
  photoEnabled = false,
}: {
  leagueId: string;
  eventId: string | null;
  drivers: Driver[];
  initial: EventFormInitial;
  /** Muestra el botón de cargar desde foto (solo si Gemini está configurado). */
  photoEnabled?: boolean;
}) {
  const [name, setName] = useState(initial.name);
  const [track, setTrack] = useState(initial.track);
  const [heldOn, setHeldOn] = useState(initial.heldOn);
  const [rows, setRows] = useState<Row[]>(
    initial.results.map((r) => ({ driverId: r.driverId, lap: r.bestLapMs ? formatLapTime(r.bestLapMs) : "" })),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  // Pilotos sumados desde la foto, hasta que la página se actualice con la lista nueva.
  const [addedDrivers, setAddedDrivers] = useState<Driver[]>([]);
  const allDrivers = [...drivers, ...addedDrivers.filter((a) => !drivers.some((d) => d.id === a.id))];

  const driverName = (id: string) => allDrivers.find((d) => d.id === id)?.name ?? "?";
  const waiting = allDrivers.filter((d) => !rows.some((r) => r.driverId === d.id));

  function importRows(imported: Row[], added: Driver[] = []) {
    if (added.length) setAddedDrivers((prev) => [...prev, ...added]);
    setRows(imported);
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    setRows(next);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const results: EventInput["results"] = [];
    for (const [i, row] of rows.entries()) {
      const bestLapMs = row.lap.trim() === "" ? null : parseLapTime(row.lap);
      if (row.lap.trim() !== "" && bestLapMs === null) {
        setError(`No entiendo la vuelta de ${driverName(row.driverId)}. Escribila así: 45.321 o 1:02.500`);
        return;
      }
      results.push({ driverId: row.driverId, position: i + 1, bestLapMs });
    }

    startTransition(async () => {
      const result = await saveEvent(leagueId, eventId, { name, track, heldOn, results });
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          Nombre
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Kartódromo <span className="text-subtle">(opcional)</span>
          <input
            className="input"
            value={track}
            onChange={(e) => setTrack(e.target.value)}
            placeholder="Ej: Kartódromo de Zárate"
            maxLength={80}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Día
          <input className="input" type="date" value={heldOn} onChange={(e) => setHeldOn(e.target.value)} required />
        </label>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="section-title">Orden de llegada</h2>
        {photoEnabled && <PhotoImport leagueId={leagueId} onImport={importRows} />}
        {rows.length === 0 && (
          <p className="text-sm text-muted">Tocá a los pilotos abajo en el orden en que cruzaron la meta.</p>
        )}
        <ol className="flex flex-col gap-2">
          {rows.map((row, i) => (
            <li key={row.driverId} className="card flex items-center gap-2 p-2">
              <span className="w-8 text-center font-display text-lg font-bold italic text-volt">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate font-medium">{driverName(row.driverId)}</span>
              <input
                className="input w-24 px-2 py-1.5 text-sm tabular-nums"
                inputMode="decimal"
                placeholder="Vuelta"
                aria-label={`Mejor vuelta de ${driverName(row.driverId)}`}
                value={row.lap}
                onChange={(e) =>
                  setRows(rows.map((r, j) => (j === i ? { ...r, lap: e.target.value } : r)))
                }
              />
              <div className="flex">
                <button type="button" className="px-1.5 text-muted disabled:opacity-20" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Subir">
                  ▲
                </button>
                <button
                  type="button"
                  className="px-1.5 text-muted disabled:opacity-20"
                  onClick={() => move(i, 1)}
                  disabled={i === rows.length - 1}
                  aria-label="Bajar"
                >
                  ▼
                </button>
                <button
                  type="button"
                  className="px-1.5 text-subtle hover:text-danger"
                  onClick={() => setRows(rows.filter((_, j) => j !== i))}
                  aria-label="Sacar"
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ol>

        {waiting.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-subtle">
              {rows.length === 0 ? "Pilotos:" : "Faltan (si alguien no corrió, dejalo acá):"}
            </p>
            <div className="flex flex-wrap gap-2">
              {waiting.map((driver) => (
                <button
                  key={driver.id}
                  type="button"
                  className="btn-secondary py-1.5 text-sm"
                  onClick={() => setRows([...rows, { driverId: driver.id, lap: "" }])}
                >
                  + {driver.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button className="btn-primary py-3" disabled={pending || rows.length === 0}>
        {pending ? "Guardando…" : "Guardar fecha"}
      </button>
    </form>
  );
}
