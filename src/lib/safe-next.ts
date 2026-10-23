/** Solo deja redirigir a rutas internas (evita redirecciones a otros sitios). */
export function safeNext(next: string | null | undefined, fallback = "/ligas"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
