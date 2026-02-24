import { Formation, CreateFormationDTO, PlayerState, PlaySide } from "@/entities";
import Container from "@/dataAccess/container";

export class FormationService {
  async getAllFormations(): Promise<Formation[]> {
    try {
      const repo = Container.getFormationRepository();
      return await repo.getAll();
    } catch (error) {
      console.error("Error getting formations:", error);
      throw new Error("Failed to fetch formations");
    }
  }

  async getFormationById(id: string): Promise<Formation | null> {
    try {
      const repo = Container.getFormationRepository();
      return await repo.getById(id);
    } catch (error) {
      console.error(`Error getting formation ${id}:`, error);
      throw new Error("Failed to fetch formation");
    }
  }

  async saveFormation(name: string, side: PlaySide, players: PlayerState[]): Promise<Formation> {
    if (!name || name.trim().length === 0) {
      throw new Error("Formation name is required");
    }

    if (!players || players.length === 0) {
      throw new Error("Formation must have at least one player");
    }

    try {
      const repo = Container.getFormationRepository();
      const dto: CreateFormationDTO = {
        name: name.trim(),
        side,
        players,
      };
      return await repo.create(dto);
    } catch (error) {
      console.error("Error saving formation:", error);
      throw new Error("Failed to save formation");
    }
  }

  async deleteFormation(id: string): Promise<void> {
    try {
      const repo = Container.getFormationRepository();
      await repo.delete(id);
    } catch (error) {
      console.error(`Error deleting formation ${id}:`, error);
      throw new Error("Failed to delete formation");
    }
  }
}

export const formationService = new FormationService();
