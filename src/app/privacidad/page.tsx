import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = { title: "Política de privacidad" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-4 py-10 text-fg-2">
      <h1 className="display text-3xl leading-none">Política de privacidad</h1>
      <p className="text-sm text-subtle">Última actualización: 24 de octubre de 2026</p>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold text-fg">Qué datos guardamos</h2>
        <ul className="flex list-disc flex-col gap-1 pl-5">
          <li>Tu mail, para que puedas iniciar sesión. Si entrás con Google, también recibimos tu nombre y tu foto de perfil.</li>
          <li>Lo que cargás en la app: nombres de ligas, pilotos y grupos, resultados de karting y pronósticos de F1.</li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold text-fg">Para qué los usamos</h2>
        <p>
          Solo para que la app funcione: mostrar tablas, calcular puntos y que tus amigos vean los resultados de las ligas y
          grupos que comparten con vos. No vendemos ni compartimos tus datos con nadie para publicidad.
        </p>
        <p>
          Las tablas de las ligas y grupos se pueden ver con su link de invitación: cualquiera que tenga ese link ve los
          nombres de los pilotos o jugadores y sus resultados, pero nunca sus mails.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold text-fg">Dónde se guardan</h2>
        <p>
          Usamos Supabase para la base de datos y el inicio de sesión, y Vercel para alojar la app. Los resultados oficiales
          de F1 se consultan a una API pública; no le mandamos ningún dato tuyo.
        </p>
        <p>
          Si usás “Cargar desde foto”, la foto de la planilla y los nombres de los pilotos de esa liga se envían a Google
          Gemini para leer los resultados. Google puede usar ese contenido para mejorar sus servicios. Si preferís que no,
          cargá la fecha a mano.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold text-fg">Borrar tus datos</h2>
        <p>
          Podés pedir que borremos tu cuenta y todo lo que cargaste escribiendo a{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-volt underline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </section>

      <Link href="/" className="back-link">
        ← Volver
      </Link>
    </main>
  );
}
