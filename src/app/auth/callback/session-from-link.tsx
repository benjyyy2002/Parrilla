"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function SessionFromLink({ next }: { next: string }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = hash.get("access_token");
    const refreshToken = hash.get("refresh_token");
    const loginWithError = `/login?error=link&next=${encodeURIComponent(next)}`;

    // Link vencido, ya usado o incompleto: Supabase manda #error=... en lugar de la sesión.
    if (!accessToken || !refreshToken) {
      window.location.replace(loginWithError);
      return;
    }

    createClient()
      .auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        if (error) {
          setFailed(true);
          window.location.replace(loginWithError);
          return;
        }
        // Recarga completa para que el servidor lea la sesión nueva de las cookies.
        window.location.replace(next);
      });
  }, [next]);

  return <p className="text-center text-muted">{failed ? "No pudimos iniciar sesión…" : "Entrando…"}</p>;
}
