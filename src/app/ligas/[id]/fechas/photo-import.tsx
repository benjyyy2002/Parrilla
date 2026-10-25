"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import type { Driver } from "@/lib/types";
import { addPhotoDrivers, readEventPhoto, type PhotoRow } from "../../actions";

type ImportedRow = { driverId: string; lap: string };

/** Achica la foto antes de subirla (las del celular pesan varios MB y a la IA le sobra con 1600 px). */
async function shrink(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    return blob ?? file;
  } catch {
    // Formatos que el navegador no sabe dibujar (ej. HEIC en algunos Android): se sube tal cual.
    return file;
  }
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function PhotoImport({
  leagueId,
  onImport,
}: {
  leagueId: string;
  /** Recibe el orden de llegada para el formulario y, si se sumaron, los pilotos nuevos. */
  onImport: (rows: ImportedRow[], addedDrivers?: Driver[]) => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [photoRows, setPhotoRows] = useState<PhotoRow[] | null>(null);
  /** Índices (en photoRows) de los pilotos sin liga que el usuario quiere sumar. */
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [addedCount, setAddedCount] = useState(0);

  const unmatched = (photoRows ?? []).map((row, i) => ({ row, i })).filter(({ row }) => !row.driverId);
  const matchedCount = (photoRows ?? []).length - unmatched.length;

  function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setAddedCount(0);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("photo", await shrink(file), "planilla.jpg");
      const result = await readEventPhoto(leagueId, formData);
      if (inputRef.current) inputRef.current.value = "";

      if (result.error !== null) {
        setPhotoRows(null);
        setError(result.error);
        return;
      }
      setPhotoRows(result.rows);
      setSelected(new Set(result.rows.flatMap((row, i) => (row.driverId ? [] : [i]))));
      onImport(result.rows.flatMap((row) => (row.driverId ? [{ driverId: row.driverId, lap: row.lap }] : [])));
    });
  }

  function toggle(i: number) {
    const next = new Set(selected);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setSelected(next);
  }

  function addSelected() {
    if (!photoRows || selected.size === 0) return;
    setError(null);
    startTransition(async () => {
      const names = [...selected].map((i) => photoRows[i].name);
      const result = await addPhotoDrivers(leagueId, names);
      if (result.error !== null) {
        setError(result.error);
        return;
      }

      const byReadName = new Map(result.drivers.map((d) => [d.readName, d.id]));
      const updated = photoRows.map((row) => ({ ...row, driverId: row.driverId ?? byReadName.get(row.name) ?? null }));
      setPhotoRows(updated);
      setSelected(new Set());
      setAddedCount(result.drivers.length);
      onImport(
        updated.flatMap((row) => (row.driverId ? [{ driverId: row.driverId, lap: row.lap }] : [])),
        result.drivers.map((d) => ({ id: d.id, name: d.name, user_id: null })),
      );
      // Actualiza la lista de pilotos del resto de la página.
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <button
        type="button"
        className="btn-secondary w-full py-3"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
      >
        {pending && !photoRows ? (
          <>
            <span className="size-2 animate-pulse rounded-full bg-volt" /> Leyendo la planilla…
          </>
        ) : (
          "📷 Cargar desde foto de la planilla"
        )}
      </button>

      {error && <p className="rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</p>}

      {photoRows && (
        <div className="flex flex-col gap-3 rounded-lg border border-volt/30 bg-volt/5 p-3 text-sm">
          <p className="text-fg-2">
            📋 Leímos <strong className="text-fg">{plural(photoRows.length, "piloto", "pilotos")}</strong> en la planilla
            {matchedCount > 0 && (
              <>
                {" "}· <strong className="text-volt">{matchedCount} de tu liga</strong>
              </>
            )}
            .{addedCount > 0 && ` Sumamos ${plural(addedCount, "piloto nuevo", "pilotos nuevos")} a la liga.`} Revisá el
            orden y las vueltas antes de guardar.
          </p>

          {unmatched.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-volt/20 pt-3">
              <p className="text-fg-2">
                <strong className="text-fg">{plural(unmatched.length, "piloto no está", "pilotos no están")}</strong> en tu
                liga. Marcá los que son del grupo para sumarlos (si alguno es de otra tanda, desmarcalo):
              </p>
              <div className="flex flex-wrap gap-1.5">
                {unmatched.map(({ row, i }) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggle(i)}
                    className={`chip transition-colors ${selected.has(i) ? "border-volt/50 bg-volt/15 text-volt" : "line-through opacity-60"}`}
                  >
                    {selected.has(i) ? "✓ " : ""}
                    {row.name}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="btn-primary w-full"
                disabled={pending || selected.size === 0}
                onClick={addSelected}
              >
                {pending ? "Sumando…" : `➕ Sumar ${plural(selected.size, "piloto", "pilotos")} a la liga`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
