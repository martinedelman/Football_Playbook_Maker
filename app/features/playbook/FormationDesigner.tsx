import { useState } from "react";
import { Link } from "react-router";
import {
  FIELD_HEIGHT,
  FIELD_PADDING,
  FIELD_WIDTH,
  PlayField,
} from "./PlayField";
import type { Coordinate, Player } from "./types";
import { slugify } from "./utils";

function clampPosition({ x, y }: Coordinate): Coordinate {
  return {
    x: Math.min(Math.max(x, FIELD_PADDING), FIELD_WIDTH - FIELD_PADDING),
    y: Math.min(Math.max(y, FIELD_PADDING), FIELD_HEIGHT - FIELD_PADDING),
  };
}

function createInitialPlayers(count: number): Player[] {
  const centerX = FIELD_WIDTH / 2;
  const baseY = FIELD_HEIGHT / 2 + 80;
  const spacing = 60;
  return Array.from({ length: count }, (_, index) => {
    const number = index + 1;
    const offset = index - (count - 1) / 2;
    return {
      id: `player-${number}`,
      label: `P${number}`,
      role: "Jugador",
      position: {
        x: centerX + offset * spacing,
        y: baseY,
      },
    } satisfies Player;
  });
}

const TEMPLATE_OPTIONS = [
  { id: "tackle", label: "Plantilla 11 vs 11", count: 11 },
  { id: "flag", label: "Plantilla Flag 5 vs 5", count: 5 },
];

export function FormationDesigner() {
  const [players, setPlayers] = useState<Player[]>(() => createInitialPlayers(11));
  const [nextPlayerNumber, setNextPlayerNumber] = useState(() => 12);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [formationName, setFormationName] = useState("Formación personalizada");
  const [formationDescription, setFormationDescription] = useState(
    "Organiza la alineación inicial, posiciona a cada jugador y exporta la formación en JSON.",
  );

  const handlePlayerPositionChange = (playerId: string, position: Coordinate) => {
    const clamped = clampPosition(position);
    setPlayers((current) =>
      current.map((player) => (player.id === playerId ? { ...player, position: clamped } : player)),
    );
  };

  const handleFieldClick = (coordinate: Coordinate) => {
    if (!selectedPlayerId) return;
    handlePlayerPositionChange(selectedPlayerId, coordinate);
  };

  const handlePlayerSelect = (playerId: string) => {
    setSelectedPlayerId(playerId);
  };

  const handleLabelChange = (playerId: string, label: string) => {
    setPlayers((current) =>
      current.map((player) => (player.id === playerId ? { ...player, label } : player)),
    );
  };

  const handleRoleChange = (playerId: string, role: string) => {
    setPlayers((current) =>
      current.map((player) => (player.id === playerId ? { ...player, role } : player)),
    );
  };

  const handleRemovePlayer = (playerId: string) => {
    setPlayers((current) => current.filter((player) => player.id !== playerId));
    setSelectedPlayerId((current) => (current === playerId ? null : current));
  };

  const handleAddPlayer = () => {
    const id = `player-${nextPlayerNumber}`;
    const newPlayer: Player = {
      id,
      label: `P${nextPlayerNumber}`,
      role: "Jugador",
      position: {
        x: FIELD_WIDTH / 2,
        y: FIELD_HEIGHT / 2,
      },
    };
    setPlayers((current) => [...current, newPlayer]);
    setNextPlayerNumber((current) => current + 1);
    setSelectedPlayerId(id);
  };

  const handleTemplate = (count: number) => {
    const newPlayers = createInitialPlayers(count);
    setPlayers(newPlayers);
    setNextPlayerNumber(count + 1);
    setSelectedPlayerId(newPlayers[0]?.id ?? null);
  };

  const handleResetPositions = () => {
    handleTemplate(players.length || 1);
  };

  const handleDownload = () => {
    const id = slugify(formationName) || `formacion-${Date.now()}`;
    const payload = {
      id,
      label: formationName,
      teamSize: players.length,
      description: formationDescription,
      players: players.map(({ id, label, role, position }) => ({ id, label, role, position })),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${id}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="container mx-auto px-4 py-10 space-y-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-300">Herramientas</p>
            <h1 className="text-3xl font-bold text-emerald-100">Diseñador de Formaciones</h1>
            <p className="mt-2 max-w-2xl text-sm text-emerald-200/80">
              Arrastra a los jugadores sobre el campo, actualiza sus etiquetas y guarda la formación para
              reutilizarla en el creador de jugadas.
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-400/60 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:border-emerald-300 hover:bg-emerald-400/10"
          >
            Volver al creador de jugadas
          </Link>
        </header>

        <section className="grid gap-8 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-4">
            <div className="relative aspect-[8/5] w-full overflow-hidden rounded-3xl border border-emerald-400/20 bg-emerald-950/40 p-4">
              <PlayField
                players={players}
                highlightPlayerId={selectedPlayerId ?? undefined}
                onFieldClick={handleFieldClick}
                onPlayerPositionChange={handlePlayerPositionChange}
                onPlayerPointerDown={handlePlayerSelect}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              {TEMPLATE_OPTIONS.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => handleTemplate(template.count)}
                  className="rounded-full border border-emerald-500/40 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:border-emerald-300 hover:bg-emerald-400/10"
                >
                  {template.label}
                </button>
              ))}
              <button
                type="button"
                onClick={handleResetPositions}
                className="rounded-full border border-emerald-500/40 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:border-emerald-300 hover:bg-emerald-400/10"
              >
                Reacomodar jugadores
              </button>
            </div>
          </div>

          <div className="space-y-6 rounded-3xl border border-emerald-500/20 bg-emerald-950/60 p-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-emerald-100" htmlFor="formation-name">
                Nombre de la formación
              </label>
              <input
                id="formation-name"
                type="text"
                value={formationName}
                onChange={(event) => setFormationName(event.target.value)}
                className="w-full rounded-lg border border-emerald-500/30 bg-slate-900/80 px-3 py-2 text-emerald-100 outline-none focus:border-emerald-300"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-emerald-100" htmlFor="formation-description">
                Descripción
              </label>
              <textarea
                id="formation-description"
                value={formationDescription}
                onChange={(event) => setFormationDescription(event.target.value)}
                rows={3}
                className="w-full rounded-lg border border-emerald-500/30 bg-slate-900/80 px-3 py-2 text-sm text-emerald-100 outline-none focus:border-emerald-300"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-slate-900/60 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-emerald-100">Jugadores</p>
                <p className="text-xs text-emerald-200/70">Actualmente hay {players.length} elementos en la formación.</p>
              </div>
              <button
                type="button"
                onClick={handleAddPlayer}
                className="rounded-full border border-emerald-400/60 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:border-emerald-300 hover:bg-emerald-400/10"
              >
                Agregar jugador
              </button>
            </div>

            <ul className="space-y-3">
              {players.map((player) => {
                const isSelected = player.id === selectedPlayerId;
                return (
                  <li
                    key={player.id}
                    className={`rounded-xl border px-4 py-3 text-sm transition ${
                      isSelected
                        ? "border-emerald-300/80 bg-emerald-500/10"
                        : "border-emerald-500/20 bg-slate-900/50 hover:border-emerald-400/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handlePlayerSelect(player.id)}
                        className="text-left text-emerald-100"
                      >
                        {player.label} <span className="text-xs text-emerald-200/70">({player.role})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemovePlayer(player.id)}
                        className="rounded-full border border-red-400/40 px-3 py-1 text-xs font-semibold text-red-200 transition hover:border-red-300 hover:bg-red-400/10"
                      >
                        Quitar
                      </button>
                    </div>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      <label className="flex flex-col text-xs font-semibold text-emerald-200/80">
                        Etiqueta
                        <input
                          type="text"
                          value={player.label}
                          onChange={(event) => handleLabelChange(player.id, event.target.value)}
                          className="mt-1 rounded-lg border border-emerald-500/30 bg-slate-900/80 px-2 py-1 text-sm text-emerald-100 outline-none focus:border-emerald-300"
                        />
                      </label>
                      <label className="flex flex-col text-xs font-semibold text-emerald-200/80">
                        Rol
                        <input
                          type="text"
                          value={player.role}
                          onChange={(event) => handleRoleChange(player.id, event.target.value)}
                          className="mt-1 rounded-lg border border-emerald-500/30 bg-slate-900/80 px-2 py-1 text-sm text-emerald-100 outline-none focus:border-emerald-300"
                        />
                      </label>
                    </div>
                    <p className="mt-2 text-xs text-emerald-200/70">
                      Posición: {player.position.x.toFixed(0)} x {player.position.y.toFixed(0)}
                    </p>
                  </li>
                );
              })}
            </ul>

            <button
              type="button"
              onClick={handleDownload}
              className="w-full rounded-full bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-emerald-300"
            >
              Descargar formación en JSON
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

