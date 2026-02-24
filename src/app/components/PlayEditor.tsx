"use client";

import { useState } from "react";
import { Play, PlayerState, PlayerRoute, AnnotationStroke, Point, PlaySide } from "@/entities";
import { playService } from "@/services/playService";
import { formationService } from "@/services/formationService";
import FieldCanvas from "./FieldCanvas";
import Toolbar from "./Toolbar";

export type ToolMode = "select" | "route" | "pen";

interface PlayEditorProps {
  play: Play;
  onUpdate: (play: Play) => void;
}

export default function PlayEditor({ play, onUpdate }: PlayEditorProps) {
  const [toolMode, setToolMode] = useState<ToolMode>("select");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const handlePlayersChange = async (players: PlayerState[]) => {
    try {
      const updated = await playService.updatePlayPlayers(play.id, players);
      onUpdate(updated);
      setIsDirty(false);
    } catch (error) {
      console.error("Failed to update players:", error);
    }
  };

  const handleRoutesChange = async (routes: PlayerRoute[]) => {
    try {
      const updated = await playService.updatePlayRoutes(play.id, routes);
      onUpdate(updated);
      setIsDirty(false);
    } catch (error) {
      console.error("Failed to update routes:", error);
    }
  };

  const handleAnnotationsChange = async (annotations: AnnotationStroke[]) => {
    try {
      const updated = await playService.updatePlayAnnotations(play.id, annotations);
      onUpdate(updated);
      setIsDirty(false);
    } catch (error) {
      console.error("Failed to update annotations:", error);
    }
  };

  const handleClearAnnotations = async () => {
    await handleAnnotationsChange([]);
  };

  const handleSaveFormation = async (name: string) => {
    if (!name.trim()) {
      alert("Please enter a formation name");
      return;
    }

    try {
      await formationService.saveFormation(name, play.side, play.players);
      alert("Formation saved successfully!");
    } catch (error) {
      console.error("Failed to save formation:", error);
      alert("Error saving formation");
    }
  };

  const handleLoadFormation = async (formationId: string) => {
    try {
      const updated = await playService.applyFormationToPlay(play.id, formationId);
      onUpdate(updated);
    } catch (error) {
      console.error("Failed to load formation:", error);
      alert("Error loading formation");
    }
  };

  const handlePlayerColorChange = async (color: string) => {
    if (!selectedPlayerId) return;

    const updatedPlayers = play.players.map((p) => (p.playerId === selectedPlayerId ? { ...p, color } : p));
    await handlePlayersChange(updatedPlayers);
  };

  const selectedPlayer = play.players.find((p) => p.playerId === selectedPlayerId);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{play.name}</h2>
            <p className="text-sm text-gray-500">{play.side === PlaySide.OFFENSE ? "Offensive" : "Defensive"} Play</p>
          </div>
          {isDirty && <span className="text-sm text-orange-600">Unsaved changes</span>}
        </div>
      </div>

      {/* Toolbar */}
      <Toolbar
        toolMode={toolMode}
        onToolModeChange={setToolMode}
        playSide={play.side}
        selectedPlayerId={selectedPlayerId}
        selectedPlayerColor={selectedPlayer?.color}
        onPlayerColorChange={handlePlayerColorChange}
        onSaveFormation={handleSaveFormation}
        onLoadFormation={handleLoadFormation}
        onClearAnnotations={handleClearAnnotations}
      />

      {/* Canvas */}
      <div className="flex-1 overflow-hidden p-4">
        <FieldCanvas
          players={play.players}
          routes={play.routes}
          annotations={play.annotations}
          toolMode={toolMode}
          selectedPlayerId={selectedPlayerId}
          playSide={play.side}
          onPlayersChange={handlePlayersChange}
          onRoutesChange={handleRoutesChange}
          onAnnotationsChange={handleAnnotationsChange}
          onSelectPlayer={setSelectedPlayerId}
        />
      </div>
    </div>
  );
}
