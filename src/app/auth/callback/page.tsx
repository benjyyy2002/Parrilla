import type { Metadata } from "next";
import { safeNext } from "@/lib/safe-next";
import { SessionFromLink } from "./session-from-link";

export const metadata: Metadata = { title: "Entrando…" };

// Destino del link del mail: la sesión viene en el fragmento (#access_token=...),
// que solo se puede leer desde el navegador.
export default async function AuthCallbackPage({ searchParams }: PageProps<"/auth/callback">) {
  const params = await searchParams;
  const next = safeNext(typeof params.next === "string" ? params.next : null);

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-4 px-4 py-12">
      <SessionFromLink next={next} />
    </main>
  );
}
