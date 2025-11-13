import type { Route } from "./+types/home";
import { PlaybookBuilder } from "../features/playbook/PlaybookBuilder";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Football Playbook Maker" },
    {
      name: "description",
      content:
        "Crea jugadas ofensivas y defensivas de football americano o flag, dibuja rutas y exporta tu playbook en JSON.",
    },
  ];
}

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="container mx-auto px-4">
        <PlaybookBuilder />
      </div>
    </main>
  );
}
