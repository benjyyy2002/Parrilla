"use client";

import { createClient as createPlainClient } from "@supabase/supabase-js";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// El botón de Google aparece recién cuando el proveedor está configurado en Supabase.
const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_LOGIN === "1";

/**
 * El link del mail se pide con el flujo "implicit": la sesión viene en el propio link,
 * así funciona aunque lo abras en otro navegador o en el celular (con PKCE, el que usa
 * el cliente de @supabase/ssr, solo anda en el mismo navegador donde lo pediste).
 * La página /auth/callback guarda esa sesión en las cookies.
 */
function createMagicLinkClient() {
  return createPlainClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { flowType: "implicit", persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export function LoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendLink(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await createMagicLinkClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    setLoading(false);
    if (error) {
      setError(
        error.status === 429
          ? "Se mandaron demasiados mails. Esperá un rato y probá de nuevo."
          : error.message,
      );
      return;
    }
    setSent(true);
  }

  async function signInWithGoogle() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}` },
    });
    // Si sale bien, el navegador ya se fue a Google: solo llegamos acá si falló.
    if (error) {
      setLoading(false);
      setError("No pudimos conectar con Google. Probá de nuevo.");
    }
  }

  if (sent) {
    return (
      <div className="card flex flex-col gap-3">
        <p className="text-lg font-semibold">📬 Revisá tu mail</p>
        <p className="text-sm text-fg-2">
          Te mandamos un link a <strong>{email}</strong>. Tocalo y listo: vas a entrar en el navegador o el celular donde
          lo abras. Si no aparece, fijate en spam.
        </p>
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex gap-2">
          <button type="button" className="btn-secondary flex-1 text-sm" onClick={() => sendLink()} disabled={loading}>
            {loading ? "Enviando…" : "Reenviar"}
          </button>
          <button type="button" className="btn-secondary flex-1 text-sm" onClick={() => setSent(false)}>
            Usar otro mail
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {GOOGLE_ENABLED && (
        <>
          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={loading}
            className="inline-flex items-center justify-center gap-3 rounded-lg bg-white px-4 py-2.5 font-semibold text-ink transition-colors hover:bg-fg-2 disabled:opacity-50"
          >
            <GoogleIcon />
            Continuar con Google
          </button>

          <div className="flex items-center gap-3 text-xs text-subtle">
            <span className="h-px flex-1 bg-panel-2" />o con tu mail<span className="h-px flex-1 bg-panel-2" />
          </div>
        </>
      )}

      <form onSubmit={sendLink} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Tu mail
          <input
            className="input"
            type="email"
            autoComplete="email"
            placeholder="vos@mail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <button className="btn-secondary" disabled={loading}>
          {loading ? "Enviando…" : "Mandame el link"}
        </button>
      </form>

      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
