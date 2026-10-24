import type { Metadata } from "next";
import { safeNext } from "@/lib/safe-next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeNext(typeof params.next === "string" ? params.next : null);
  const linkError = params.error === "link";

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-12">
      <div>
        <h1 className="display text-3xl leading-none">Entrar a Parrilla</h1>
        <p className="mt-1 text-sm text-muted">
          {process.env.NEXT_PUBLIC_GOOGLE_LOGIN === "1" ? "Con tu cuenta de Google o con un link por mail." : "Te mandamos un link por mail."}{" "}
          Sin contraseñas.
        </p>
      </div>
      {linkError && (
        <p className="rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
          No pudimos iniciar sesión (el link puede haber vencido o ya se usó). Probá de nuevo.
        </p>
      )}
      <LoginForm next={next} />
    </main>
  );
}
