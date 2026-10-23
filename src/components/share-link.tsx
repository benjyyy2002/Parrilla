"use client";

import { useState } from "react";

export function ShareLink({ url, leagueName }: { url: string; leagueName: string }) {
  const [copied, setCopied] = useState(false);
  const message = `Sumate a la liga "${leagueName}" en Parrilla y mirá la tabla: ${url}`;

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-2">
      <code className="truncate rounded-lg bg-zinc-950 px-3 py-2 text-xs text-zinc-400">{url}</code>
      <div className="flex gap-2">
        <a
          className="btn-primary flex-1 bg-green-600 hover:bg-green-500"
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Mandar por WhatsApp
        </a>
        <button type="button" className="btn-secondary" onClick={copy}>
          {copied ? "¡Copiado!" : "Copiar"}
        </button>
      </div>
    </div>
  );
}
