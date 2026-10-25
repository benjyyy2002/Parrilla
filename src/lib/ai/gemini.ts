// Lectura de planillas de resultados con Gemini (API REST, sin SDK).
// Solo se usa del lado del servidor: la API key nunca llega al navegador.

const API = "https://generativelanguage.googleapis.com/v1beta";

export type PhotoRow = {
  position: number;
  /** El nombre tal como aparece en la planilla. */
  name: string;
  kart: string | null;
  /** Mejor vuelta tal como aparece ("45.123", "1:02.345"). */
  bestLap: string | null;
  /** El piloto de la liga que la IA cree que es (de la lista que le pasamos). */
  suggested: string | null;
};

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

type ModelInfo = { name: string; supportedGenerationMethods?: string[] };
let cachedModel: string | null = null;

/**
 * Elige el modelo: GEMINI_MODEL si está configurado; si no, "flash-lite-latest" (en las pruebas leyó
 * las planillas igual de bien que Flash pero en ~2 s, contra más de un minuto del Flash en el plan
 * gratis), después "flash-latest" o el Flash más nuevo. Así no se rompe cuando Google cambia los nombres.
 */
async function pickModel(apiKey: string): Promise<string> {
  if (process.env.GEMINI_MODEL) return process.env.GEMINI_MODEL;
  if (cachedModel) return cachedModel;

  const response = await fetch(`${API}/models?pageSize=200`, { headers: { "x-goog-api-key": apiKey } });
  if (!response.ok) throw new Error(`Gemini: no se pudo listar modelos (${response.status})`);
  const { models = [] } = (await response.json()) as { models?: ModelInfo[] };

  const names = models
    .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
    .map((m) => m.name.replace(/^models\//, ""));

  const version = (n: string) => Number(/gemini-(\d+(?:\.\d+)?)/.exec(n)?.[1] ?? 0);
  const plainFlash = names
    .filter((n) => /^gemini-\d+(\.\d+)?-flash$/.test(n))
    .sort((a, b) => version(b) - version(a));

  const preferred = ["gemini-flash-lite-latest", "gemini-flash-latest"].find((n) => names.includes(n));
  const model = preferred ?? plainFlash[0];
  if (!model) throw new Error("Gemini: no hay ningún modelo Flash disponible para esta API key");
  cachedModel = model;
  return model;
}

const SCHEMA = {
  type: "OBJECT",
  properties: {
    is_results_sheet: { type: "BOOLEAN" },
    rows: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          position: { type: "INTEGER" },
          name: { type: "STRING" },
          kart: { type: "STRING", nullable: true },
          best_lap: { type: "STRING", nullable: true },
          league_driver: { type: "STRING", nullable: true },
        },
        required: ["position", "name"],
      },
    },
  },
  required: ["is_results_sheet", "rows"],
};

function prompt(driverNames: string[]): string {
  return `Esta imagen debería ser una planilla o pantalla de resultados de una carrera de karting (impresa, en una pantalla o escrita a mano).

Extraé cada piloto con:
- position: su posición final (1 = ganador). Si la planilla no muestra posiciones, usá el orden de la lista.
- name: el nombre exactamente como está escrito.
- kart: el número de kart, si aparece.
- best_lap: la mejor vuelta exactamente como está escrita (por ejemplo "45.123" o "1:02.345"), si aparece.
- league_driver: cuál de estos pilotos de la liga es, solo si estás bastante seguro; si no, null: ${JSON.stringify(driverNames)}

Reglas:
- No inventes nada. Si una fila no se lee, salteala.
- Si hay varias tandas o tablas, usá la de la carrera final (la de posiciones, no la de clasificación).
- Si la imagen no es una planilla de resultados, devolvé is_results_sheet = false y rows vacío.`;
}

type GeminiResponse = {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
  error?: { message?: string; status?: string };
};

export class PhotoReadError extends Error {}

/** Normaliza la respuesta del modelo (puede venir con filas raras o incompletas). */
export function parsePhotoResponse(json: unknown): PhotoRow[] {
  const data = json as { is_results_sheet?: boolean; rows?: Record<string, unknown>[] };
  if (data?.is_results_sheet === false) {
    throw new PhotoReadError("La foto no parece una planilla de resultados.");
  }
  const text = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

  return (data?.rows ?? [])
    .map((row) => ({
      position: Number(row.position),
      name: text(row.name) ?? "",
      kart: text(row.kart),
      bestLap: text(row.best_lap),
      suggested: text(row.league_driver),
    }))
    .filter((row) => Number.isInteger(row.position) && row.position > 0 && row.name)
    .sort((a, b) => a.position - b.position);
}

export async function readResultsPhoto(
  image: { base64: string; mimeType: string },
  driverNames: string[],
): Promise<PhotoRow[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new PhotoReadError("La lectura de fotos no está configurada.");

  const model = await pickModel(apiKey);
  const response = await fetch(`${API}/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ inlineData: { mimeType: image.mimeType, data: image.base64 } }, { text: prompt(driverNames) }],
        },
      ],
      generationConfig: { temperature: 0, responseMimeType: "application/json", responseSchema: SCHEMA },
    }),
  });

  const body = (await response.json().catch(() => ({}))) as GeminiResponse;
  if (!response.ok) {
    if (response.status === 429) {
      throw new PhotoReadError("Se alcanzó el límite gratis de Gemini por ahora. Probá en un rato o cargala a mano.");
    }
    console.error("Gemini error", response.status, body.error?.message);
    throw new PhotoReadError("No pudimos leer la foto. Probá de nuevo o cargala a mano.");
  }

  const raw = body.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  try {
    return parsePhotoResponse(JSON.parse(raw));
  } catch (error) {
    if (error instanceof PhotoReadError) throw error;
    throw new PhotoReadError("No pudimos leer la foto. Probá de nuevo o cargala a mano.");
  }
}
