import { Playbook, CreatePlaybookDTO } from "@/entities";
import Container from "@/dataAccess/container";

export class PlaybookService {
  async getAllPlaybooks(): Promise<Playbook[]> {
    try {
      const repo = Container.getPlaybookRepository();
      return await repo.getAll();
    } catch (error) {
      console.error("Error getting playbooks:", error);
      throw new Error("Failed to fetch playbooks");
    }
  }

  async getPlaybookById(id: string): Promise<Playbook | null> {
    try {
      const repo = Container.getPlaybookRepository();
      return await repo.getById(id);
    } catch (error) {
      console.error(`Error getting playbook ${id}:`, error);
      throw new Error("Failed to fetch playbook");
    }
  }

  async createPlaybook(name: string): Promise<Playbook> {
    if (!name || name.trim().length === 0) {
      throw new Error("Playbook name is required");
    }

    try {
      const repo = Container.getPlaybookRepository();
      const dto: CreatePlaybookDTO = { name: name.trim() };
      return await repo.create(dto);
    } catch (error) {
      console.error("Error creating playbook:", error);
      throw new Error("Failed to create playbook");
    }
  }

  async updatePlaybookName(id: string, name: string): Promise<Playbook> {
    if (!name || name.trim().length === 0) {
      throw new Error("Playbook name is required");
    }

    try {
      const repo = Container.getPlaybookRepository();
      return await repo.update(id, { name: name.trim() });
    } catch (error) {
      console.error(`Error updating playbook ${id}:`, error);
      throw new Error("Failed to update playbook");
    }
  }

  async reorderPlays(id: string, orderedPlayIds: string[]): Promise<Playbook> {
    try {
      const repo = Container.getPlaybookRepository();
      const playbook = await repo.getById(id);
      if (!playbook) throw new Error("Playbook not found");

      const currentIds = new Set(playbook.plays.map((play) => play.id));
      const hasSamePlays =
        orderedPlayIds.length === playbook.plays.length &&
        new Set(orderedPlayIds).size === currentIds.size &&
        orderedPlayIds.every((playId) => currentIds.has(playId));
      if (!hasSamePlays) throw new Error("Invalid play order");

      const playsById = new Map(playbook.plays.map((play) => [play.id, play]));
      const reorderedPlays = orderedPlayIds.map((playId) => playsById.get(playId)!);
      return await repo.update(id, { plays: reorderedPlays });
    } catch (error) {
      console.error(`Error reordering plays for playbook ${id}:`, error);
      throw new Error("Failed to reorder plays");
    }
  }

  async deletePlaybook(id: string): Promise<void> {
    try {
      const repo = Container.getPlaybookRepository();
      await repo.delete(id);
    } catch (error) {
      console.error(`Error deleting playbook ${id}:`, error);
      throw new Error("Failed to delete playbook");
    }
  }
}

export const playbookService = new PlaybookService();
