"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}` },
    });
    setLoading(false);
    if (error) {
      setError(error.status === 429 ? "Pediste muchos códigos seguidos. Esperá unos minutos." : error.message);
      return;
    }
    setStep("code");
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: "email" });
    if (error) {
      setLoading(false);
      setError("El código no es válido o venció.");
      return;
    }
    router.replace(next);
    router.refresh();
  }

  if (step === "code") {
    return (
      <form onSubmit={verifyCode} className="flex flex-col gap-3">
        <p className="text-sm text-zinc-300">
          Te mandamos un mail a <strong>{email}</strong>. Tocá el link del mail desde este mismo navegador, o
          escribí el código si el mail trae uno.
        </p>
        <input
          className="input text-center text-2xl tracking-[0.4em]"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="000000"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          maxLength={10}
          required
          autoFocus
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button className="btn-primary" disabled={loading || code.length < 6}>
          {loading ? "Verificando…" : "Entrar"}
        </button>
        <button type="button" className="text-sm text-zinc-400 underline" onClick={() => setStep("email")}>
          Usar otro mail
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={sendCode} className="flex flex-col gap-3">
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
          autoFocus
        />
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button className="btn-primary" disabled={loading}>
        {loading ? "Enviando…" : "Mandame el código"}
      </button>
    </form>
  );
}
