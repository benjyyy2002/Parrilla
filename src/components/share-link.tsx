"use client";

import { useState } from "react";
import { displayUrl } from "@/lib/site";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.47-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.48-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.42-.08-.12-.27-.2-.57-.34zM12.05 21.8h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88zm8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.17-3.48-8.41z" />
    </svg>
  );
}

/** Muestra el texto como lo hace WhatsApp: respeta los saltos de línea y pasa *esto* a negrita. */
function WhatsAppText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*[^*\n]+\*)/g).map((part, i) =>
        part.startsWith("*") && part.endsWith("*") && part.length > 2 ? <strong key={i}>{part.slice(1, -1)}</strong> : part,
      )}
    </>
  );
}

/**
 * Bloque para compartir por WhatsApp: muestra cómo le va a llegar el mensaje al grupo,
 * un botón grande para mandarlo y otro para copiar el link. El link va al final, en su propia línea.
 */
export function ShareLink({ url, message }: { url: string; message: string }) {
  const [copied, setCopied] = useState(false);
  const text = `${message}\n${url}`;

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Vista previa: una burbuja como la de WhatsApp */}
      <div className="flex flex-col gap-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-subtle">Así le llega al grupo</span>
        <div className="relative ml-auto max-w-[92%] rounded-xl rounded-tr-sm bg-[#005c4b] px-3 py-2 text-sm leading-snug whitespace-pre-line text-[#e9edef] shadow-lg">
          <WhatsAppText text={message} />
          {"\n"}
          <span className="break-all text-[#53bdeb] underline">{displayUrl(url)}</span>
          <span className="mt-1 block text-right text-[10px] text-[#e9edef]/60">ahora ✓✓</span>
        </div>
      </div>

      <a className="btn-whatsapp" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer">
        <WhatsAppIcon className="relative z-10 size-6" />
        <span className="relative z-10">Mandar por WhatsApp</span>
      </a>

      <button
        type="button"
        onClick={copy}
        className="flex items-center justify-between gap-3 rounded-lg border border-line bg-ink/60 px-3 py-2.5 text-left transition-colors hover:border-volt/50"
      >
        <span className="truncate font-mono text-xs text-muted">{displayUrl(url)}</span>
        <span className={`shrink-0 font-display text-xs font-bold uppercase tracking-[0.15em] ${copied ? "text-volt" : "text-fg-2"}`}>
          {copied ? "¡Copiado! ✓" : "Copiar link"}
        </span>
      </button>
    </div>
  );
}
