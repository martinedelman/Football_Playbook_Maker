import { PlayerTemplate, CreatePlayerTemplateDTO, UpdatePlayerTemplateDTO, NamedRoute } from "@/entities";
import Container from "@/dataAccess/container";

export class PlayerTemplateService {
  async getAllPlayerTemplates(): Promise<PlayerTemplate[]> {
    try {
      const repo = Container.getPlayerTemplateRepository();
      return await repo.getAll();
    } catch (error) {
      console.error("Error getting player templates:", error);
      throw new Error("Failed to fetch player templates");
    }
  }

  async getPlayerTemplateById(id: string): Promise<PlayerTemplate | null> {
    try {
      const repo = Container.getPlayerTemplateRepository();
      return await repo.getById(id);
    } catch (error) {
      console.error(`Error getting player template ${id}:`, error);
      throw new Error("Failed to fetch player template");
    }
  }

  async createPlayerTemplate(dto: CreatePlayerTemplateDTO): Promise<PlayerTemplate> {
    if (!dto.name || dto.name.trim().length === 0) {
      throw new Error("Player template name is required");
    }

    try {
      const repo = Container.getPlayerTemplateRepository();
      return await repo.create(dto);
    } catch (error) {
      console.error("Error creating player template:", error);
      throw new Error("Failed to create player template");
    }
  }

  async updatePlayerTemplateName(id: string, name: string): Promise<PlayerTemplate> {
    if (!name || name.trim().length === 0) {
      throw new Error("Player template name is required");
    }

    try {
      const repo = Container.getPlayerTemplateRepository();
      const dto: UpdatePlayerTemplateDTO = { name: name.trim() };
      return await repo.update(id, dto);
    } catch (error) {
      console.error(`Error updating player template ${id}:`, error);
      throw new Error("Failed to update player template");
    }
  }

  async updatePlayerTemplateLabel(id: string, playerLabel: string): Promise<PlayerTemplate> {
    try {
      const repo = Container.getPlayerTemplateRepository();
      const dto: UpdatePlayerTemplateDTO = { playerLabel };
      return await repo.update(id, dto);
    } catch (error) {
      console.error(`Error updating player template label ${id}:`, error);
      throw new Error("Failed to update player template");
    }
  }

  async updatePlayerTemplateColor(id: string, playerColor: string): Promise<PlayerTemplate> {
    try {
      const repo = Container.getPlayerTemplateRepository();
      const dto: UpdatePlayerTemplateDTO = { playerColor };
      return await repo.update(id, dto);
    } catch (error) {
      console.error(`Error updating player template color ${id}:`, error);
      throw new Error("Failed to update player template");
    }
  }

  async updatePlayerTemplatePosition(id: string, initialX: number, initialY: number): Promise<PlayerTemplate> {
    try {
      const repo = Container.getPlayerTemplateRepository();
      const dto: UpdatePlayerTemplateDTO = { initialX, initialY };
      return await repo.update(id, dto);
    } catch (error) {
      console.error(`Error updating player template position ${id}:`, error);
      throw new Error("Failed to update player template");
    }
  }

  async updatePlayerTemplateRoutes(id: string, routes: NamedRoute[]): Promise<PlayerTemplate> {
    try {
      const repo = Container.getPlayerTemplateRepository();
      const dto: UpdatePlayerTemplateDTO = { routes };
      return await repo.update(id, dto);
    } catch (error) {
      console.error(`Error updating player template routes ${id}:`, error);
      throw new Error("Failed to update routes");
    }
  }

  async deletePlayerTemplate(id: string): Promise<void> {
    try {
      const repo = Container.getPlayerTemplateRepository();
      await repo.delete(id);
    } catch (error) {
      console.error(`Error deleting player template ${id}:`, error);
      throw new Error("Failed to delete player template");
    }
  }
}

export const playerTemplateService = new PlayerTemplateService();
