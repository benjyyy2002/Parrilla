"use client";

import { useState } from "react";

/** Link para compartir: botón de WhatsApp (con mensaje armado) y botón de copiar. */
export function ShareLink({ url, message }: { url: string; message: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-2">
      <code className="truncate rounded-lg bg-ink px-3 py-2 text-xs text-muted">{url}</code>
      <div className="flex gap-2">
        <a
          className="btn-primary flex-1 bg-whatsapp text-ink hover:brightness-110"
          href={`https://wa.me/?text=${encodeURIComponent(`${message} ${url}`)}`}
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
