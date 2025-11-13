import { Link } from "react-router";
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
      <div className="container mx-auto px-4 pb-12">
        <header className="flex flex-col gap-3 pb-8 pt-10 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-300">Herramientas</p>
            <h1 className="text-3xl font-bold text-emerald-100">Football Playbook Maker</h1>
            <p className="mt-2 max-w-2xl text-sm text-emerald-200/80">
              Diseña jugadas ofensivas y defensivas, guarda tus ideas en JSON y compártelas con tu staff.
            </p>
          </div>
          <Link
            to="/formations"
            className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-400/60 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:border-emerald-300 hover:bg-emerald-400/10"
          >
            Crear formaciones personalizadas
          </Link>
        </header>
        <PlaybookBuilder />
      </div>
    </main>
  );
}
