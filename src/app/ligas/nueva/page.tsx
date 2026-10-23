import type { Metadata } from "next";
import { CreateLeagueForm } from "./create-league-form";

export const metadata: Metadata = { title: "Nueva liga" };

export default function NewLeaguePage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-bold">Nueva liga</h1>
      <CreateLeagueForm defaultSeason={String(new Date().getFullYear())} />
    </main>
  );
}
