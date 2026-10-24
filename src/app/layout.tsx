import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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

export const metadata: Metadata = {
  title: { default: "Parrilla · Tu liga de karting", template: "%s · Parrilla" },
  description: "Armá el campeonato de karting con tus amigos: cargás la fecha y la tabla se arma sola.",
};

export const viewport: Viewport = {
  themeColor: "#09090b",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="es-AR" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <header className="border-b border-zinc-800">
          <div className="mx-auto flex h-14 w-full max-w-2xl items-center justify-between px-4">
            <Link href={user ? "/ligas" : "/"} className="text-lg font-black italic tracking-tight">
              🏁 Parrilla
            </Link>
            {user ? (
              <nav className="flex items-center gap-4 text-sm">
                <Link href="/ligas" className="text-zinc-300 hover:text-white">
                  Ligas
                </Link>
                <Link href="/prode" className="text-zinc-300 hover:text-white">
                  Prode
                </Link>
                <form action="/auth/salir" method="post">
                  <button className="text-zinc-500 hover:text-zinc-100">Salir</button>
                </form>
              </nav>
            ) : (
              <Link href="/login" className="text-sm text-zinc-400 hover:text-zinc-100">
                Entrar
              </Link>
            )}
          </div>
        </header>
        {children}
        <footer className="border-t border-zinc-900">
          <div className="mx-auto flex w-full max-w-2xl gap-4 px-4 py-4 text-xs text-zinc-600">
            <Link href="/privacidad" className="hover:text-zinc-400">
              Privacidad
            </Link>
            <Link href="/terminos" className="hover:text-zinc-400">
              Términos
            </Link>
          </div>
        </footer>
        <SessionHashRedirect />
      </body>
    </html>
  );
}
