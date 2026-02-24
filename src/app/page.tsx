"use client";

import { useState, useEffect } from "react";
import { Playbook, Play, PlaySide, PlayerTemplate, PlayerRoute, PlayerState } from "@/entities";
import { playbookService } from "@/services/playbookService";
import { playService } from "@/services/playService";
import { formationService } from "@/services/formationService";
import { playerTemplateService } from "@/services/playerTemplateService";
import PlaybookList from "@/app/components/PlaybookList";
import PlayEditor from "@/app/components/PlayEditor";
import PlayerTemplateEditor from "@/app/components/PlayerTemplateEditor";

type AutoPlayPattern = {
  formationName: string;
  routes: {
    X: number;
    C: number;
    Z: number;
    last: number;
  };
  lastLabel: string;
};

const AUTO_PLAY_PATTERN =
  /^(?<formation>.+?)\s+(?<x>\d+)\s*-\s*(?<c>\d+)\s*-\s*(?<z>\d+)\s*-\s*(?<label>[A-Za-z]+)(?<route>\d+)\s*$/i;

const parseAutoPlayName = (name: string): AutoPlayPattern | null => {
  const match = name.trim().match(AUTO_PLAY_PATTERN);
  if (!match || !match.groups) return null;

  const formationName = match.groups.formation.trim();
  const x = Number(match.groups.x);
  const c = Number(match.groups.c);
  const z = Number(match.groups.z);
  const lastRoute = Number(match.groups.route);
  const lastLabel = match.groups.label.trim().toUpperCase();

  if (
    !formationName ||
    !lastLabel ||
    Number.isNaN(x) ||
    Number.isNaN(c) ||
    Number.isNaN(z) ||
    Number.isNaN(lastRoute)
  ) {
    return null;
  }

  return {
    formationName,
    routes: { X: x, C: c, Z: z, last: lastRoute },
    lastLabel,
  };
};

const findPlayerByLabel = (players: PlayerState[], labels: string[]): PlayerState | undefined => {
  const lookup = labels.map((label) => label.toUpperCase());
  return players.find((player) => lookup.includes(player.label.toUpperCase()));
};

const extractRouteNumber = (name: string): number | null => {
  const match = name.trim().match(/\d+/);
  if (!match) return null;
  const value = Number(match[0]);
  return Number.isNaN(value) ? null : value;
};

const getTemplateRoutePoints = (
  template: PlayerTemplate,
  targetRouteNumber: number,
  player: PlayerState,
): PlayerRoute | null => {
  const namedRoute = template.routes.find((route) => extractRouteNumber(route.name) === targetRouteNumber);
  if (!namedRoute) return null;

  const templateX = template.initialX !== undefined ? template.initialX : 250;
  const templateY = template.initialY !== undefined ? template.initialY : 150;
  const offsetX = player.x - templateX;
  const offsetY = player.y - templateY;

  const adjustedPoints = namedRoute.points.map((point) => ({
    x: point.x + offsetX,
    y: point.y + offsetY,
  }));

  return {
    playerId: player.playerId,
    points: adjustedPoints,
  };
};

const buildRoutesFromPattern = (
  players: PlayerState[],
  templates: PlayerTemplate[],
  pattern: AutoPlayPattern,
): PlayerRoute[] => {
  const routes: PlayerRoute[] = [];

  const playerX = findPlayerByLabel(players, ["X"]);
  const playerC = findPlayerByLabel(players, ["C", "Y"]);
  const playerZ = findPlayerByLabel(players, ["Z"]);
  const playerLast = findPlayerByLabel(players, [pattern.lastLabel]);

  const templateX = templates.find((template) => template.playerLabel.toUpperCase() === "X");
  const templateC =
    templates.find((template) => template.playerLabel.toUpperCase() === "C") ||
    templates.find((template) => template.playerLabel.toUpperCase() === "Y");
  const templateZ = templates.find((template) => template.playerLabel.toUpperCase() === "Z");
  const templateLast = templates.find(
    (template) => template.playerLabel.toUpperCase() === pattern.lastLabel.toUpperCase(),
  );

  if (playerX && templateX) {
    const route = getTemplateRoutePoints(templateX, pattern.routes.X, playerX);
    if (route) routes.push(route);
  }

  if (playerC && templateC) {
    const route = getTemplateRoutePoints(templateC, pattern.routes.C, playerC);
    if (route) routes.push(route);
  }

  if (playerZ && templateZ) {
    const route = getTemplateRoutePoints(templateZ, pattern.routes.Z, playerZ);
    if (route) routes.push(route);
  }

  if (playerLast && templateLast) {
    const route = getTemplateRoutePoints(templateLast, pattern.routes.last, playerLast);
    if (route) routes.push(route);
  }

  return routes;
};

export default function Home() {
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null);
  const [selectedPlay, setSelectedPlay] = useState<Play | null>(null);
  const [playerTemplates, setPlayerTemplates] = useState<PlayerTemplate[]>([]);
  const [selectedPlayerTemplate, setSelectedPlayerTemplate] = useState<PlayerTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [playbooksData, templatesData] = await Promise.all([
        playbookService.getAllPlaybooks(),
        playerTemplateService.getAllPlayerTemplates(),
      ]);
      setPlaybooks(playbooksData);
      setPlayerTemplates(templatesData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlaybook = async (name: string) => {
    try {
      const newPlaybook = await playbookService.createPlaybook(name);
      setPlaybooks([...playbooks, newPlaybook]);
      setSelectedPlaybook(newPlaybook);
    } catch (error) {
      console.error("Failed to create playbook:", error);
      alert("Error creating playbook");
    }
  };

  const handleSelectPlaybook = (playbook: Playbook) => {
    setSelectedPlaybook(playbook);
    setSelectedPlay(null);
  };

  const handleDeletePlaybook = async (id: string) => {
    try {
      await playbookService.deletePlaybook(id);
      setPlaybooks(playbooks.filter((pb: Playbook) => pb.id !== id));
      if (selectedPlaybook?.id === id) {
        setSelectedPlaybook(null);
        setSelectedPlay(null);
      }
    } catch (error) {
      console.error("Failed to delete playbook:", error);
      alert("Error deleting playbook");
    }
  };

  const handleCreatePlay = async (name: string, side: PlaySide) => {
    if (!selectedPlaybook) return;

    try {
      const autoPattern = parseAutoPlayName(name);
      const newPlay = await playService.createPlay({
        name,
        side,
        playbookId: selectedPlaybook.id,
      });

      let playToSelect = newPlay;

      if (autoPattern) {
        const [formations, templates] = await Promise.all([
          formationService.getAllFormations(),
          playerTemplateService.getAllPlayerTemplates(),
        ]);

        const formation = formations.find(
          (item) => item.side === side && item.name.toLowerCase() === autoPattern.formationName.toLowerCase(),
        );

        if (formation) {
          playToSelect = await playService.applyFormationToPlay(playToSelect.id, formation.id);
        }

        const routes = buildRoutesFromPattern(playToSelect.players, templates, autoPattern);
        if (routes.length > 0) {
          playToSelect = await playService.updatePlayRoutes(playToSelect.id, routes);
        }
      }

      // Reload playbook to get updated plays
      const updated = await playbookService.getPlaybookById(selectedPlaybook.id);
      if (updated) {
        setSelectedPlaybook(updated);
        setPlaybooks(playbooks.map((pb: Playbook) => (pb.id === updated.id ? updated : pb)));
        setSelectedPlay(playToSelect);
      }
    } catch (error) {
      console.error("Failed to create play:", error);
      alert("Error creating play");
    }
  };

  const handleSelectPlay = (play: Play) => {
    setSelectedPlay(play);
  };

  const handleDeletePlay = async (id: string) => {
    try {
      await playService.deletePlay(id);

      // Reload playbook to get updated plays
      if (selectedPlaybook) {
        const updated = await playbookService.getPlaybookById(selectedPlaybook.id);
        if (updated) {
          setSelectedPlaybook(updated);
          setPlaybooks(playbooks.map((pb: Playbook) => (pb.id === updated.id ? updated : pb)));
        }
      }

      if (selectedPlay?.id === id) {
        setSelectedPlay(null);
      }
    } catch (error) {
      console.error("Failed to delete play:", error);
      alert("Error deleting play");
    }
  };

  const handleUpdatePlay = async (updatedPlay: Play) => {
    setSelectedPlay(updatedPlay);

    // Update in playbook
    if (selectedPlaybook) {
      const updated = await playbookService.getPlaybookById(selectedPlaybook.id);
      if (updated) {
        setSelectedPlaybook(updated);
        setPlaybooks(playbooks.map((pb: Playbook) => (pb.id === updated.id ? updated : pb)));
      }
    }
  };

  const handleCreatePlayerTemplate = async (name: string) => {
    try {
      const newTemplate = await playerTemplateService.createPlayerTemplate({ name });
      setPlayerTemplates([...playerTemplates, newTemplate]);
      setSelectedPlayerTemplate(newTemplate);
      setSelectedPlay(null);
    } catch (error) {
      console.error("Failed to create player template:", error);
      alert("Error creating player template");
    }
  };

  const handleSelectPlayerTemplate = (template: PlayerTemplate) => {
    setSelectedPlayerTemplate(template);
    setSelectedPlay(null);
  };

  const handleDeletePlayerTemplate = async (id: string) => {
    try {
      await playerTemplateService.deletePlayerTemplate(id);
      setPlayerTemplates(playerTemplates.filter((t) => t.id !== id));
      if (selectedPlayerTemplate?.id === id) {
        setSelectedPlayerTemplate(null);
      }
    } catch (error) {
      console.error("Failed to delete player template:", error);
      alert("Error deleting player template");
    }
  };

  const handleUpdatePlayerTemplate = async (updatedTemplate: PlayerTemplate) => {
    setSelectedPlayerTemplate(updatedTemplate);
    setPlayerTemplates(playerTemplates.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t)));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-80 bg-white border-r border-gray-200 shadow-sm overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">Flag Football</h1>
          <p className="text-sm text-gray-500">Playbook Maker</p>
        </div>
        <PlaybookList
          playbooks={playbooks}
          selectedPlaybook={selectedPlaybook}
          selectedPlay={selectedPlay}
          playerTemplates={playerTemplates}
          selectedPlayerTemplate={selectedPlayerTemplate}
          onCreatePlaybook={handleCreatePlaybook}
          onSelectPlaybook={handleSelectPlaybook}
          onDeletePlaybook={handleDeletePlaybook}
          onCreatePlay={handleCreatePlay}
          onSelectPlay={handleSelectPlay}
          onDeletePlay={handleDeletePlay}
          onCreatePlayerTemplate={handleCreatePlayerTemplate}
          onSelectPlayerTemplate={handleSelectPlayerTemplate}
          onDeletePlayerTemplate={handleDeletePlayerTemplate}
        />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {selectedPlay ? (
          <PlayEditor play={selectedPlay} onUpdate={handleUpdatePlay} />
        ) : selectedPlayerTemplate ? (
          <PlayerTemplateEditor template={selectedPlayerTemplate} onUpdate={handleUpdatePlayerTemplate} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium">No play or template selected</h3>
              <p className="mt-1 text-sm">Select a play or player template from the sidebar or create a new one</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
