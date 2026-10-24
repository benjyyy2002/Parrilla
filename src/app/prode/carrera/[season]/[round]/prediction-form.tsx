"use client";

import { useState, useTransition } from "react";
import type { F1Driver } from "@/lib/f1";
import { savePrediction, type PredictionInput } from "../../../actions";

function DriverSelect({
  label,
  hint,
  value,
  onChange,
  grid,
  taken,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
  grid: F1Driver[];
  taken: string[];
}) {
  const teams = [...new Set(grid.map((d) => d.team))];
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span>
        {label} <span className="text-subtle">· {hint}</span>
      </span>
      <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Elegí un piloto</option>
        {teams.map((team) => (
          <optgroup key={team} label={team || "Pilotos"}>
            {grid
              .filter((d) => d.team === team)
              .map((d) => (
                <option key={d.id} value={d.id} disabled={taken.includes(d.id) && d.id !== value}>
                  {d.name}
                </option>
              ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}

export function PredictionForm({
  season,
  round,
  grid,
  initial,
}: {
  season: number;
  round: number;
  grid: F1Driver[];
  initial: PredictionInput;
}) {
  const [values, setValues] = useState(initial);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const set = (key: keyof PredictionInput) => (value: string) => {
    setValues({ ...values, [key]: value });
    setMessage(null);
  };
  const podium = [values.p1, values.p2, values.p3].filter(Boolean);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await savePrediction(season, round, values);
      setMessage(result.error ? { ok: false, text: result.error } : { ok: true, text: "¡Pronóstico guardado! Podés cambiarlo hasta que cierre." });
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <DriverSelect label="Pole" hint="5 pts" value={values.pole} onChange={set("pole")} grid={grid} taken={[]} />
      <DriverSelect label="Ganador" hint="10 pts" value={values.p1} onChange={set("p1")} grid={grid} taken={podium} />
      <DriverSelect label="2º puesto" hint="5 pts (2 si sube al podio en otro puesto)" value={values.p2} onChange={set("p2")} grid={grid} taken={podium} />
      <DriverSelect label="3º puesto" hint="5 pts (2 si sube al podio en otro puesto)" value={values.p3} onChange={set("p3")} grid={grid} taken={podium} />

      <label className="flex flex-col gap-1 text-sm">
        <span>
          Posición final de Colapinto <span className="text-subtle">· 10 pts exacta, 5 si le errás por uno</span>
        </span>
        <select className="input" value={values.colapintoPosition} onChange={(e) => set("colapintoPosition")(e.target.value)}>
          <option value="">Elegí una posición</option>
          {Array.from({ length: Math.max(grid.length, 20) }, (_, i) => i + 1).map((p) => (
            <option key={p} value={p}>
              P{p}
            </option>
          ))}
        </select>
        <span className="text-xs text-subtle">Si abandona, cuenta el puesto en que lo clasifican.</span>
      </label>

      {message && <p className={`text-sm ${message.ok ? "text-volt" : "text-danger"}`}>{message.text}</p>}

      <button className="btn-primary py-3" disabled={pending}>
        {pending ? "Guardando…" : "Guardar pronóstico"}
      </button>
    </form>
  );
}
