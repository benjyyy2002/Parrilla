"use client";

import { useEffect } from "react";

// Si Supabase no reconoce la URL de redirección, manda el link del mail a la home con la
// sesión en el fragmento (#access_token=...). Lo pasamos a /auth/callback, que la guarda.
export function SessionHashRedirect() {
  useEffect(() => {
    if (window.location.hash.includes("access_token=") && window.location.pathname !== "/auth/callback") {
      window.location.replace(`/auth/callback?next=/ligas${window.location.hash}`);
    }
  }, []);
  return null;
}
