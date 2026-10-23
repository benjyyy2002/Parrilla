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
        <h1 className="text-2xl font-bold">Entrar a Parrilla</h1>
        <p className="mt-1 text-sm text-zinc-400">Te mandamos un código por mail. Sin contraseñas.</p>
      </div>
      {linkError && (
        <p className="rounded-lg border border-red-900 bg-red-950/50 p-3 text-sm text-red-200">
          El link venció o ya se usó. Pedí uno nuevo.
        </p>
      )}
      <LoginForm next={next} />
    </main>
  );
}
