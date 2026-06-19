"use client";

import { useCallback, useState, useEffect } from "react";
import { Playbook, Play, PlaySide, PlayerTemplate, PlayerRoute, PlayerState } from "@/entities";
import { playbookService } from "@/services/playbookService";
import { playService } from "@/services/playService";
import { formationService } from "@/services/formationService";
import { playerTemplateService } from "@/services/playerTemplateService";
import PlaybookList from "@/app/components/PlaybookList";
import PlayEditor from "@/app/components/PlayEditor";
import PlayerTemplateEditor from "@/app/components/PlayerTemplateEditor";
import WelcomeGuide from "@/app/components/WelcomeGuide";
import { buildPlaybookPrintHtml } from "@/app/components/PlaybookPrintPage";
import { useFeedback } from "@/app/components/feedback/ToastProvider";
import { FeedbackStatus } from "@/app/components/feedback/types";

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
  const { showToast, showCriticalError } = useFeedback();
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null);
  const [selectedPlay, setSelectedPlay] = useState<Play | null>(null);
  const [playerTemplates, setPlayerTemplates] = useState<PlayerTemplate[]>([]);
  const [selectedPlayerTemplate, setSelectedPlayerTemplate] = useState<PlayerTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
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
      showCriticalError("Unable to load your playbooks", "The stored playbook data could not be loaded. Please reload the page.");
    } finally {
      setLoading(false);
    }
  }, [showCriticalError]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleCreatePlaybook = async (name: string): Promise<boolean> => {
    try {
      const newPlaybook = await playbookService.createPlaybook(name);
      setPlaybooks([...playbooks, newPlaybook]);
      setSelectedPlaybook(newPlaybook);
      showToast({ status: FeedbackStatus.INFO, title: "Playbook created", message: newPlaybook.name });
      return true;
    } catch (error) {
      console.error("Failed to create playbook:", error);
      showCriticalError("Playbook was not created", "The playbook could not be saved. Please try again.");
      return false;
    }
  };

  const handleSelectPlaybook = (playbook: Playbook) => {
    setSelectedPlaybook(playbook);
    setSelectedPlay(null);
  };

  const handleRenamePlaybook = async (id: string, name: string): Promise<boolean> => {
    try {
      const updatedPlaybook = await playbookService.updatePlaybookName(id, name);
      setPlaybooks((current) => current.map((playbook) => (playbook.id === id ? updatedPlaybook : playbook)));
      setSelectedPlaybook((current) => (current?.id === id ? updatedPlaybook : current));
      showToast({ status: FeedbackStatus.INFO, title: "Playbook renamed", message: updatedPlaybook.name });
      return true;
    } catch (error) {
      console.error("Failed to rename playbook:", error);
      showCriticalError("Playbook was not renamed", "The new name could not be saved. Please try again.");
      return false;
    }
  };

  const handleDeletePlaybook = async (id: string): Promise<boolean> => {
    try {
      await playbookService.deletePlaybook(id);
      setPlaybooks(playbooks.filter((pb: Playbook) => pb.id !== id));
      if (selectedPlaybook?.id === id) {
        setSelectedPlaybook(null);
        setSelectedPlay(null);
      }
      showToast({ status: FeedbackStatus.INFO, title: "Playbook deleted" });
      return true;
    } catch (error) {
      console.error("Failed to delete playbook:", error);
      showCriticalError("Playbook was not deleted", "The playbook could not be deleted. Please try again.");
      return false;
    }
  };

  const handlePrintPlaybook = (playbook: Playbook) => {
    const html = buildPlaybookPrintHtml(playbook);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, "_blank");
    if (!printWindow) {
      URL.revokeObjectURL(url);
      showToast({
        status: FeedbackStatus.WARNING,
        title: "Pop-up blocked",
        message: "Allow pop-ups in your browser to print the playbook.",
      });
      return;
    }
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  };

  const handleCreatePlay = async (name: string, side: PlaySide): Promise<boolean> => {
    if (!selectedPlaybook) return false;

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
      showToast({ status: FeedbackStatus.INFO, title: "Play created", message: playToSelect.name });
      return true;
    } catch (error) {
      console.error("Failed to create play:", error);
      showCriticalError("Play was not created", "The play could not be saved. Please try again.");
      return false;
    }
  };

  const handleSelectPlay = (play: Play) => {
    setSelectedPlay(play);
  };

  const handleRenamePlay = async (id: string, name: string): Promise<boolean> => {
    try {
      const updatedPlay = await playService.updatePlayName(id, name);
      setSelectedPlay((current) => (current?.id === id ? updatedPlay : current));
      setSelectedPlaybook((current) =>
        current
          ? { ...current, plays: current.plays.map((play) => (play.id === id ? updatedPlay : play)) }
          : current,
      );
      setPlaybooks((current) =>
        current.map((playbook) => ({
          ...playbook,
          plays: playbook.plays.map((play) => (play.id === id ? updatedPlay : play)),
        })),
      );
      showToast({ status: FeedbackStatus.INFO, title: "Play renamed", message: updatedPlay.name });
      return true;
    } catch (error) {
      console.error("Failed to rename play:", error);
      showCriticalError("Play was not renamed", "The new name could not be saved. Please try again.");
      return false;
    }
  };

  const handleReorderPlays = async (playbookId: string, orderedPlayIds: string[]): Promise<boolean> => {
    const originalPlaybook = playbooks.find((playbook) => playbook.id === playbookId);
    if (!originalPlaybook) return false;

    const playsById = new Map(originalPlaybook.plays.map((play) => [play.id, play]));
    const reorderedPlays = orderedPlayIds.map((playId) => playsById.get(playId)).filter((play): play is Play => !!play);
    if (reorderedPlays.length !== originalPlaybook.plays.length) return false;

    const optimisticPlaybook = { ...originalPlaybook, plays: reorderedPlays };
    setPlaybooks((current) =>
      current.map((playbook) => (playbook.id === playbookId ? optimisticPlaybook : playbook)),
    );
    setSelectedPlaybook((current) => (current?.id === playbookId ? optimisticPlaybook : current));

    try {
      const persistedPlaybook = await playbookService.reorderPlays(playbookId, orderedPlayIds);
      setPlaybooks((current) =>
        current.map((playbook) => (playbook.id === playbookId ? persistedPlaybook : playbook)),
      );
      setSelectedPlaybook((current) => (current?.id === playbookId ? persistedPlaybook : current));
      return true;
    } catch (error) {
      console.error("Failed to reorder plays:", error);
      setPlaybooks((current) =>
        current.map((playbook) => (playbook.id === playbookId ? originalPlaybook : playbook)),
      );
      setSelectedPlaybook((current) => (current?.id === playbookId ? originalPlaybook : current));
      showToast({
        status: FeedbackStatus.ERROR,
        title: "Play order was not saved",
        message: "The previous order has been restored.",
      });
      return false;
    }
  };

  const handleDeletePlay = async (id: string): Promise<boolean> => {
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
      showToast({ status: FeedbackStatus.INFO, title: "Play deleted" });
      return true;
    } catch (error) {
      console.error("Failed to delete play:", error);
      showCriticalError("Play was not deleted", "The play could not be deleted. Please try again.");
      return false;
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

  const handleCreatePlayerTemplate = async (name: string): Promise<boolean> => {
    try {
      const newTemplate = await playerTemplateService.createPlayerTemplate({ name });
      setPlayerTemplates([...playerTemplates, newTemplate]);
      setSelectedPlayerTemplate(newTemplate);
      setSelectedPlay(null);
      showToast({ status: FeedbackStatus.INFO, title: "Player template created", message: newTemplate.name });
      return true;
    } catch (error) {
      console.error("Failed to create player template:", error);
      showCriticalError("Template was not created", "The player template could not be saved. Please try again.");
      return false;
    }
  };

  const handleSelectPlayerTemplate = (template: PlayerTemplate) => {
    setSelectedPlayerTemplate(template);
    setSelectedPlay(null);
  };

  const handleDeletePlayerTemplate = async (id: string): Promise<boolean> => {
    try {
      await playerTemplateService.deletePlayerTemplate(id);
      setPlayerTemplates(playerTemplates.filter((t) => t.id !== id));
      if (selectedPlayerTemplate?.id === id) {
        setSelectedPlayerTemplate(null);
      }
      showToast({ status: FeedbackStatus.INFO, title: "Player template deleted" });
      return true;
    } catch (error) {
      console.error("Failed to delete player template:", error);
      showCriticalError("Template was not deleted", "The player template could not be deleted. Please try again.");
      return false;
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
          onRenamePlaybook={handleRenamePlaybook}
          onSelectPlaybook={handleSelectPlaybook}
          onDeletePlaybook={handleDeletePlaybook}
          onPrintPlaybook={handlePrintPlaybook}
          onCreatePlay={handleCreatePlay}
          onRenamePlay={handleRenamePlay}
          onReorderPlays={handleReorderPlays}
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
          <WelcomeGuide />
        )}
      </main>
    </div>
  );
}
