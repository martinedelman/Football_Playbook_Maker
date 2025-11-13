import { useMemo, useState } from "react";
import { PlayField } from "./PlayField";
import { defensiveFormations, offensiveFormations } from "./formations";
import { defensiveCoverages, offensiveRoutes } from "./routeLibrary";
import type {
  Coordinate,
  DefensivePlay,
  PlayMode,
  PlaybookItem,
  Player,
  OffensivePlay,
} from "./types";
import { slugify } from "./utils";

function clonePlayers(players: Player[]): Player[] {
  return players.map((player) => ({
    ...player,
    path: player.path ? player.path.map((point) => ({ ...point })) : undefined,
  }));
}

function buildAbsolutePath(start: Coordinate, segments: Coordinate[]) {
  const points: Coordinate[] = [];
  let current = { ...start };
  segments.forEach((segment) => {
    current = { x: current.x + segment.x, y: current.y + segment.y };
    points.push(current);
  });
  return points;
}

function createDefensePlayers(formationId: string, coverageId: keyof typeof defensiveCoverages): Player[] {
  const formation = defensiveFormations.find((item) => item.id === formationId) ?? defensiveFormations[0];
  const coverage = defensiveCoverages[coverageId];
  return formation.players.map((player) => {
    const segments = coverage?.blueprint[player.id];
    return {
      ...player,
      routeName: coverage?.label,
      path: segments ? buildAbsolutePath(player.position, segments) : undefined,
    };
  });
}

function getOffensiveFormationLabel(id: string) {
  return offensiveFormations.find((formation) => formation.id === id)?.label ?? id;
}

function getDefensiveFormationLabel(id: string) {
  return defensiveFormations.find((formation) => formation.id === id)?.label ?? id;
}

function getCoverageLabel(id: string) {
  return defensiveCoverages[id]?.label ?? id;
}

export function PlaybookBuilder() {
  const [mode, setMode] = useState<PlayMode>("offense");
  const defaultOffenseFormation = offensiveFormations[0];
  const defaultDefenseFormation = defensiveFormations[0];
  const [offenseFormationId, setOffenseFormationId] = useState(defaultOffenseFormation.id);
  const [offenseFormat, setOffenseFormat] = useState<"tackle" | "flag5">(
    defaultOffenseFormation.teamSize === 5 ? "flag5" : "tackle",
  );
  const [offensePlayers, setOffensePlayers] = useState<Player[]>(() =>
    defaultOffenseFormation.players.map((player) => ({ ...player })),
  );
  const [offenseName, setOffenseName] = useState("Concepto Spread");

  const [defenseFormationId, setDefenseFormationId] = useState(defaultDefenseFormation.id);
  const [defenseCoverageId, setDefenseCoverageId] = useState<keyof typeof defensiveCoverages>("cover2");
  const [defensePlayers, setDefensePlayers] = useState<Player[]>(() =>
    createDefensePlayers(defaultDefenseFormation.id, "cover2"),
  );
  const [defenseName, setDefenseName] = useState("Cobertura Base");

  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [drawingPlayerId, setDrawingPlayerId] = useState<string | null>(null);
  const [playbook, setPlaybook] = useState<PlaybookItem[]>([]);
  const [playbookTitle, setPlaybookTitle] = useState("Playbook personalizado");

  const offenseFormation = useMemo(
    () => offensiveFormations.find((formation) => formation.id === offenseFormationId) ?? defaultOffenseFormation,
    [offenseFormationId, defaultOffenseFormation],
  );

  const defenseFormation = useMemo(
    () => defensiveFormations.find((formation) => formation.id === defenseFormationId) ?? defaultDefenseFormation,
    [defenseFormationId, defaultDefenseFormation],
  );

  const coverageOptions = useMemo(() => Object.entries(defensiveCoverages), []);

  const updateOffensePlayers = (updater: (players: Player[]) => Player[]) => {
    setOffensePlayers((prev) => updater(clonePlayers(prev)));
  };

  const updateDefensePlayers = (updater: (players: Player[]) => Player[]) => {
    setDefensePlayers((prev) => updater(clonePlayers(prev)));
  };

  const handleFormationChange = (formationId: string) => {
    setOffenseFormationId(formationId);
    const formation = offensiveFormations.find((f) => f.id === formationId);
    if (!formation) return;
    setOffenseFormat(formation.teamSize === 5 ? "flag5" : "tackle");
    setOffensePlayers(formation.players.map((player) => ({ ...player })));
    setSelectedPlayerId(null);
    setDrawingPlayerId(null);
  };

  const handleDefenseFormationChange = (formationId: string) => {
    setDefenseFormationId(formationId);
    const formation = defensiveFormations.find((f) => f.id === formationId);
    if (!formation) return;
    setDefensePlayers(createDefensePlayers(formation.id, defenseCoverageId));
    setSelectedPlayerId(null);
    setDrawingPlayerId(null);
  };

  const handleAssignRoute = (playerId: string, routeName: string) => {
    updateOffensePlayers((players) =>
      players.map((player) => {
        if (player.id !== playerId) return player;
        if (!routeName) {
          return { ...player, routeName: undefined, path: undefined };
        }
        if (routeName === "Custom") {
          return { ...player, routeName, path: [] };
        }
        if (routeName === "Block") {
          return { ...player, routeName, path: undefined };
        }
        const segments = offensiveRoutes[routeName as keyof typeof offensiveRoutes];
        if (!segments) {
          return { ...player, routeName, path: undefined };
        }
        return {
          ...player,
          routeName,
          path: buildAbsolutePath(player.position, segments),
        };
      }),
    );
  };

  const handleAssignCoverage = (playerId: string, mode: "preset" | "custom") => {
    if (mode === "custom") {
      updateDefensePlayers((players) =>
        players.map((player) =>
          player.id === playerId ? { ...player, routeName: "Custom", path: [] } : player,
        ),
      );
    } else {
      const coverage = defensiveCoverages[defenseCoverageId];
      updateDefensePlayers((players) =>
        players.map((player) => {
          if (player.id !== playerId) return player;
          const segments = coverage?.blueprint[player.id];
          if (!segments) {
            return { ...player, routeName: coverage?.label ?? "Cobertura", path: undefined };
          }
          return {
            ...player,
            routeName: coverage.label,
            path: buildAbsolutePath(player.position, segments),
          };
        }),
      );
    }
  };

  const applyCoverageToDefense = (coverageId: keyof typeof defensiveCoverages) => {
    setDefenseCoverageId(coverageId);
    setDefensePlayers(createDefensePlayers(defenseFormationId, coverageId));
    setSelectedPlayerId(null);
    setDrawingPlayerId(null);
  };

  const handleFieldClick = (coordinate: Coordinate) => {
    if (!drawingPlayerId) return;
    if (mode === "offense") {
      updateOffensePlayers((players) =>
        players.map((player) => {
          if (player.id !== drawingPlayerId) return player;
          const nextPath = [...(player.path ?? [])];
          nextPath.push(coordinate);
          return { ...player, path: nextPath, routeName: player.routeName ?? "Custom" };
        }),
      );
    } else {
      updateDefensePlayers((players) =>
        players.map((player) => {
          if (player.id !== drawingPlayerId) return player;
          const nextPath = [...(player.path ?? [])];
          nextPath.push(coordinate);
          return { ...player, path: nextPath, routeName: player.routeName ?? "Custom" };
        }),
      );
    }
  };

  const handleStartDrawing = (playerId: string) => {
    setSelectedPlayerId(playerId);
    setDrawingPlayerId(playerId);
    if (mode === "offense") {
      updateOffensePlayers((players) =>
        players.map((player) =>
          player.id === playerId ? { ...player, routeName: "Custom", path: [] } : player,
        ),
      );
    } else {
      updateDefensePlayers((players) =>
        players.map((player) =>
          player.id === playerId ? { ...player, routeName: "Custom", path: [] } : player,
        ),
      );
    }
  };

  const handleFinishDrawing = () => {
    setDrawingPlayerId(null);
  };

  const handleClearPath = (playerId: string) => {
    if (mode === "offense") {
      updateOffensePlayers((players) =>
        players.map((player) =>
          player.id === playerId ? { ...player, path: undefined, routeName: undefined } : player,
        ),
      );
    } else {
      updateDefensePlayers((players) =>
        players.map((player) =>
          player.id === playerId ? { ...player, path: undefined, routeName: undefined } : player,
        ),
      );
    }
    setSelectedPlayerId((current) => (current === playerId ? null : current));
    setDrawingPlayerId((current) => (current === playerId ? null : current));
  };

  const handleAddPlayToPlaybook = () => {
    if (mode === "offense") {
      const play: OffensivePlay = {
        name: offenseName || `Jugada Ofensiva ${playbook.length + 1}`,
        format: offenseFormat,
        formationId: offenseFormation.id,
        players: clonePlayers(offensePlayers),
      };
      setPlaybook((prev) => [...prev, { type: "offense", play }]);
    } else {
      const play: DefensivePlay = {
        name: defenseName || `Jugada Defensiva ${playbook.length + 1}`,
        formationId: defenseFormation.id,
        coverageId: defenseCoverageId,
        players: clonePlayers(defensePlayers),
      };
      setPlaybook((prev) => [...prev, { type: "defense", play }]);
    }
  };

  const handleRemovePlay = (index: number) => {
    setPlaybook((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleClearPlaybook = () => {
    setPlaybook([]);
  };

  const handleDownload = () => {
    if (playbook.length === 0) return;
    const title = playbookTitle.trim() || "Playbook personalizado";
    const payload = {
      title,
      generatedAt: new Date().toISOString(),
      items: playbook,
    };
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    const fileName = slugify(title) || "playbook-personalizado";
    anchor.download = `${fileName}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const players = mode === "offense" ? offensePlayers : defensePlayers;

  return (
    <div className="flex flex-col gap-6 py-10">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold text-slate-100">Football Playbook Maker</h1>
        <p className="max-w-3xl text-slate-200">
          Diseña jugadas inspiradas en experiencias como GoArmy Edge Football y Flag Football Playmaker.
          Selecciona una formación, asigna rutas preguardadas o dibuja tus propias trayectorias y guarda todo en un
          archivo JSON listo para compartir o imprimir.
        </p>
      </header>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            setMode("offense");
            setSelectedPlayerId(null);
            setDrawingPlayerId(null);
          }}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${mode === "offense" ? "bg-yellow-400 text-slate-900" : "bg-slate-800 text-slate-200 hover:bg-slate-700"}`}
        >
          Ofensiva
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("defense");
            setSelectedPlayerId(null);
            setDrawingPlayerId(null);
          }}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${mode === "defense" ? "bg-yellow-400 text-slate-900" : "bg-slate-800 text-slate-200 hover:bg-slate-700"}`}
        >
          Defensiva
        </button>
      </div>
      <section className="grid grid-cols-1 lg:grid-cols-[400px,1fr] gap-6">
        <div className="space-y-6">
          {mode === "offense" ? (
            <div className="space-y-4 rounded-3xl border border-slate-700 bg-slate-900/70 p-6">
              <h2 className="text-xl font-semibold text-slate-100">Configurar jugada ofensiva</h2>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-300">Nombre de la jugada</label>
                <input
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-yellow-400 focus:outline-none"
                  value={offenseName}
                  onChange={(event) => setOffenseName(event.target.value)}
                  placeholder="Ej. Mesh vs Cover 2"
                />
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-300">Formación</label>
                <select
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-yellow-400 focus:outline-none"
                  value={offenseFormationId}
                  onChange={(event) => handleFormationChange(event.target.value)}
                >
                  {offensiveFormations.map((formation) => (
                    <option key={formation.id} value={formation.id}>
                      {formation.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-400">{offenseFormation.description}</p>
              </div>
              <div className="space-y-3">
                <span className="block text-sm font-medium text-slate-300">Formato</span>
                <div className="flex gap-3">
                  {(
                    [
                      { id: "tackle", label: "Tackle 11 vs 11" },
                      { id: "flag5", label: "Flag 5 vs 5" },
                    ] as const
                  ).map((option) => (
                    <label key={option.id} className="flex items-center gap-2 text-sm text-slate-200">
                      <input
                        type="radio"
                        checked={offenseFormat === option.id}
                        onChange={() => setOffenseFormat(option.id)}
                        disabled={option.id === "tackle" && offenseFormation.teamSize === 5}
                        className="accent-yellow-400"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
                <p className="text-xs text-slate-500">
                  Las rutas preguardadas están pensadas para receptores exteriores, slots y running backs.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-200">Asignar rutas</h3>
                <div className="space-y-3">
                  {offensePlayers.map((player) => (
                    <div key={player.id} className="rounded-2xl border border-slate-700 bg-slate-800/70 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-100">{player.label}</p>
                          <p className="text-xs text-slate-400">{player.role}</p>
                        </div>
                        <button
                          type="button"
                          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${selectedPlayerId === player.id ? "bg-yellow-400 text-slate-900" : "bg-slate-700 text-slate-200 hover:bg-slate-600"}`}
                          onClick={() => setSelectedPlayerId(player.id)}
                        >
                          Seleccionar
                        </button>
                      </div>
                      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                        <select
                          className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-yellow-400 focus:outline-none"
                          value={player.routeName ?? ""}
                          onChange={(event) => handleAssignRoute(player.id, event.target.value)}
                        >
                          <option value="">Elegir ruta</option>
                          {Object.keys(offensiveRoutes).map((routeKey) => (
                            <option key={routeKey} value={routeKey}>
                              {routeKey}
                            </option>
                          ))}
                          <option value="Custom">Personalizada</option>
                        </select>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="flex-1 rounded-xl border border-yellow-400 px-3 py-2 text-xs font-semibold text-yellow-300 hover:bg-yellow-400 hover:text-slate-900"
                            onClick={() => handleStartDrawing(player.id)}
                          >
                            Dibujar
                          </button>
                          <button
                            type="button"
                            className="rounded-xl border border-red-400 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-400 hover:text-slate-900"
                            onClick={() => handleClearPath(player.id)}
                          >
                            Limpiar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 rounded-3xl border border-slate-700 bg-slate-900/70 p-6">
              <h2 className="text-xl font-semibold text-slate-100">Configurar jugada defensiva</h2>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-300">Nombre de la jugada</label>
                <input
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-yellow-400 focus:outline-none"
                  value={defenseName}
                  onChange={(event) => setDefenseName(event.target.value)}
                  placeholder="Ej. Cover 3 Buzz"
                />
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-300">Formación defensiva</label>
                <select
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-yellow-400 focus:outline-none"
                  value={defenseFormationId}
                  onChange={(event) => handleDefenseFormationChange(event.target.value)}
                >
                  {defensiveFormations.map((formation) => (
                    <option key={formation.id} value={formation.id}>
                      {formation.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-400">{defenseFormation.description}</p>
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-300">Cobertura base</label>
                <select
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-yellow-400 focus:outline-none"
                  value={defenseCoverageId}
                  onChange={(event) => applyCoverageToDefense(event.target.value as keyof typeof defensiveCoverages)}
                >
                  {coverageOptions.map(([id, coverage]) => (
                    <option key={id} value={id}>
                      {coverage.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-400">
                  {defensiveCoverages[defenseCoverageId]?.description}
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-200">Asignar responsabilidades</h3>
                <div className="space-y-3">
                  {defensePlayers.map((player) => (
                    <div key={player.id} className="rounded-2xl border border-slate-700 bg-slate-800/70 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-100">{player.label}</p>
                          <p className="text-xs text-slate-400">{player.role}</p>
                        </div>
                        <button
                          type="button"
                          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${selectedPlayerId === player.id ? "bg-yellow-400 text-slate-900" : "bg-slate-700 text-slate-200 hover:bg-slate-600"}`}
                          onClick={() => setSelectedPlayerId(player.id)}
                        >
                          Seleccionar
                        </button>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          className="rounded-xl border border-yellow-400 px-3 py-2 text-xs font-semibold text-yellow-300 hover:bg-yellow-400 hover:text-slate-900"
                          onClick={() => handleAssignCoverage(player.id, "preset")}
                        >
                          Usar cobertura
                        </button>
                        <button
                          type="button"
                          className="rounded-xl border border-blue-400 px-3 py-2 text-xs font-semibold text-blue-300 hover:bg-blue-400 hover:text-slate-900"
                          onClick={() => handleAssignCoverage(player.id, "custom")}
                        >
                          Personalizar
                        </button>
                        <button
                          type="button"
                          className="rounded-xl border border-red-400 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-400 hover:text-slate-900"
                          onClick={() => handleClearPath(player.id)}
                        >
                          Limpiar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="rounded-3xl border border-slate-700 bg-slate-900/70 p-6">
            <h2 className="text-xl font-semibold text-slate-100">Playbook actual</h2>
            {playbook.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">
                Agrega jugadas ofensivas y defensivas para construir tu librería. Luego descarga un archivo JSON
                portable sin necesidad de backend.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {playbook.map((item, index) => {
                  const isOffense = item.type === "offense";
                  const metadata = isOffense
                    ? `${getOffensiveFormationLabel(item.play.formationId)} · ${
                        item.play.format === "flag5" ? "Flag 5 vs 5" : "Tackle 11 vs 11"
                      } · ${item.play.players.length} jugadores`
                    : `${getDefensiveFormationLabel(item.play.formationId)} · ${getCoverageLabel(
                        item.play.coverageId,
                      )} · ${item.play.players.length} jugadores`;

                  return (
                    <li
                      key={index}
                      className="rounded-2xl border border-slate-700 bg-slate-800/70 px-4 py-3 text-sm text-slate-200"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex rounded-full bg-slate-700 px-2 py-1 text-xs font-semibold uppercase">
                              {isOffense ? "Ofensiva" : "Defensiva"}
                            </span>
                            <span className="font-semibold text-slate-100">{item.play.name}</span>
                          </div>
                          <p className="mt-1 text-xs text-slate-400">{metadata}</p>
                        </div>
                        <button
                          type="button"
                          className="self-start rounded-full border border-red-400 px-3 py-1 text-xs font-semibold text-red-300 transition hover:bg-red-400 hover:text-slate-900"
                          onClick={() => handleRemovePlay(index)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="mt-5 space-y-3">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300" htmlFor="playbook-title">
                  Nombre del playbook (se usará para el archivo JSON)
                </label>
                <input
                  id="playbook-title"
                  type="text"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-yellow-400 focus:outline-none"
                  value={playbookTitle}
                  onChange={(event) => setPlaybookTitle(event.target.value)}
                  placeholder="Ej. Playbook ofensivo 2025"
                />
              </div>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-yellow-300"
                  onClick={handleAddPlayToPlaybook}
                >
                  Guardar jugada actual
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-500"
                  onClick={handleClearPlaybook}
                  disabled={playbook.length === 0}
                >
                  Limpiar playbook
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-yellow-400 px-4 py-2 text-sm font-semibold text-yellow-300 hover:bg-yellow-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-500"
                  onClick={handleDownload}
                  disabled={playbook.length === 0}
                >
                  Descargar JSON
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="h-[600px] rounded-3xl border border-slate-700 bg-slate-900/50 p-4">
          <PlayField
            players={players}
            highlightPlayerId={selectedPlayerId ?? undefined}
            onFieldClick={drawingPlayerId ? handleFieldClick : undefined}
          />
          {drawingPlayerId && (
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-yellow-400/10 px-4 py-3 text-sm text-yellow-100">
              <span>Haz clic en el campo para trazar la ruta. Cuando termines, presiona finalizar.</span>
              <button
                type="button"
                className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-semibold text-slate-900"
                onClick={handleFinishDrawing}
              >
                Finalizar dibujo
              </button>
            </div>
          )}
        </div>
      </section>
      <footer className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 text-sm text-slate-400">
        <p>
          Consejos: usa las formaciones de Flag 5vs5 para crear planes rápidos o alterna entre formaciones Spread y Trips
          para atacar distintas coberturas. Combina la cobertura Flag Zone con jugadas ofensivas de Flag para tener un
          playbook completo listo para imprimir o compartir digitalmente.
        </p>
      </footer>
    </div>
  );
}
