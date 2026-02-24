"use client";

import { useState, useEffect } from "react";
import { Playbook, Play, PlaySide } from "@/entities";
import { playbookService } from "@/services/playbookService";
import { playService } from "@/services/playService";
import PlaybookList from "@/app/components/PlaybookList";
import PlayEditor from "@/app/components/PlayEditor";

export default function Home() {
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null);
  const [selectedPlay, setSelectedPlay] = useState<Play | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlaybooks();
  }, []);

  const loadPlaybooks = async () => {
    try {
      setLoading(true);
      const data = await playbookService.getAllPlaybooks();
      setPlaybooks(data);
    } catch (error) {
      console.error("Failed to load playbooks:", error);
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
      const newPlay = await playService.createPlay({
        name,
        side,
        playbookId: selectedPlaybook.id,
      });

      // Reload playbook to get updated plays
      const updated = await playbookService.getPlaybookById(selectedPlaybook.id);
      if (updated) {
        setSelectedPlaybook(updated);
        setPlaybooks(playbooks.map((pb: Playbook) => (pb.id === updated.id ? updated : pb)));
        setSelectedPlay(newPlay);
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
          onCreatePlaybook={handleCreatePlaybook}
          onSelectPlaybook={handleSelectPlaybook}
          onDeletePlaybook={handleDeletePlaybook}
          onCreatePlay={handleCreatePlay}
          onSelectPlay={handleSelectPlay}
          onDeletePlay={handleDeletePlay}
        />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {selectedPlay ? (
          <PlayEditor play={selectedPlay} onUpdate={handleUpdatePlay} />
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
              <h3 className="mt-2 text-sm font-medium">No play selected</h3>
              <p className="mt-1 text-sm">Select a play from the sidebar or create a new one</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
