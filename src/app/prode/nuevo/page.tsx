import type { Metadata } from "next";
import Link from "next/link";
import { NewGroupForm } from "./new-group-form";

export const metadata: Metadata = { title: "Nuevo grupo de prode" };

export default function NewProdeGroupPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
      <div>
        <Link href="/prode" className="text-sm text-zinc-500 hover:text-zinc-300">
          ← Prode
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Nuevo grupo de prode</h1>
      </div>
      <NewGroupForm />
    </main>
  );
}
