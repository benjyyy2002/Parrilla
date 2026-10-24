"use client";

import { useRef, useState, useTransition } from "react";
import { readEventPhoto } from "../../actions";

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

export function PhotoImport({
  leagueId,
  onImport,
}: {
  leagueId: string;
  onImport: (rows: ImportedRow[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string; unmatched?: string[] } | null>(null);

  function handleFile(file: File | undefined) {
    if (!file) return;
    setMessage(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("photo", await shrink(file), "planilla.jpg");
      const result = await readEventPhoto(leagueId, formData);
      if (inputRef.current) inputRef.current.value = "";

      if (result.error !== null) {
        setMessage({ ok: false, text: result.error });
        return;
      }
      onImport(result.rows);
      setMessage({
        ok: true,
        text: `Leímos ${result.rows.length} ${result.rows.length === 1 ? "piloto" : "pilotos"}. Revisá el orden y las vueltas antes de guardar.`,
        unmatched: result.unmatched,
      });
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
        {pending ? (
          <>
            <span className="size-2 animate-pulse rounded-full bg-volt" /> Leyendo la planilla…
          </>
        ) : (
          "📷 Cargar desde foto de la planilla"
        )}
      </button>

      {message && (
        <div
          className={`rounded-lg border p-3 text-sm ${
            message.ok ? "border-volt/30 bg-volt/5 text-fg-2" : "border-danger/40 bg-danger/10 text-danger"
          }`}
        >
          <p>{message.text}</p>
          {message.unmatched && message.unmatched.length > 0 && (
            <p className="mt-1 text-xs text-muted">
              No reconocimos: <strong className="text-fg-2">{message.unmatched.join(", ")}</strong>. Si corrieron,
              agregalos a la liga en “Pilotos” o sumalos abajo a mano.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
