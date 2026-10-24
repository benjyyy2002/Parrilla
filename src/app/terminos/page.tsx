import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = { title: "Términos de uso" };

export default function TermsPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-4 py-10 text-zinc-300">
      <h1 className="text-2xl font-bold text-zinc-100">Términos de uso</h1>
      <p className="text-sm text-zinc-500">Última actualización: 24 de octubre de 2026</p>

      <ul className="flex list-disc flex-col gap-2 pl-5">
        <li>Parrilla es una app gratuita para llevar ligas de karting entre amigos y jugar un prode de F1.</li>
        <li>
          El prode es un juego entre amigos, sin apuestas ni premios en dinero. No uses Parrilla para organizar apuestas.
        </li>
        <li>
          Los resultados oficiales de F1 se obtienen de una API pública y pueden tener demoras o errores. Parrilla no está
          afiliada a la Fórmula 1 ni a ningún equipo o piloto.
        </li>
        <li>Sos responsable de lo que cargás. No cargues datos de otras personas que no quieran aparecer.</li>
        <li>La app se ofrece tal como está y puede cambiar o dejar de funcionar en cualquier momento.</li>
      </ul>

      <p>
        Consultas:{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-red-400 underline">
          {CONTACT_EMAIL}
        </a>
      </p>

      <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300">
        ← Volver
      </Link>
    </main>
  );
}
