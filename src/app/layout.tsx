import type { Metadata, Viewport } from "next";
import { Chakra_Petch, Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { NavLink } from "@/components/nav-link";
import { SessionHashRedirect } from "@/components/session-hash-redirect";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const chakra = Chakra_Petch({
  variable: "--font-chakra",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: { default: "Parrilla · Tu liga de karting", template: "%s · Parrilla" },
  description: "Armá el campeonato de karting con tus amigos y jugá el prode de F1: la tabla se arma sola.",
};

export const viewport: Viewport = {
  themeColor: "#05070d",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html
      lang="es-AR"
      className={`${geistSans.variable} ${geistMono.variable} ${chakra.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <header className="sticky top-0 z-20 border-b border-line bg-ink/75 backdrop-blur-md">
          <div className="mx-auto flex h-14 w-full max-w-2xl items-center justify-between px-4">
            <Link href={user ? "/ligas" : "/"} aria-label="Parrilla, inicio">
              <Logo />
            </Link>
            {user ? (
              <nav className="flex items-center gap-5">
                <NavLink href="/ligas">Ligas</NavLink>
                <NavLink href="/prode">Prode</NavLink>
                <form action="/auth/salir" method="post">
                  <button className="font-mono text-[11px] uppercase tracking-[0.15em] text-subtle hover:text-danger">
                    Salir
                  </button>
                </form>
              </nav>
            ) : (
              <Link href="/login" className="btn-secondary px-4 py-1.5 text-xs">
                Entrar
              </Link>
            )}
          </div>
          {/* Línea de "telemetría" debajo del header */}
          <div className="h-px bg-gradient-to-r from-transparent via-volt/60 to-transparent" />
        </header>

        {children}

        <footer className="mt-8 border-t border-line">
          <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-4 px-4 py-5">
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-faint">Parrilla · 2026</span>
            <div className="flex gap-4 font-mono text-[11px] uppercase tracking-[0.15em] text-subtle">
              <Link href="/privacidad" className="hover:text-fg">
                Privacidad
              </Link>
              <Link href="/terminos" className="hover:text-fg">
                Términos
              </Link>
            </div>
          </div>
        </footer>
        <SessionHashRedirect />
      </body>
    </html>
  );
}
