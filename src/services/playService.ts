import { Play, CreatePlayDTO, UpdatePlayDTO, PlayerState, PlayerRoute, AnnotationStroke, RouteStyle } from "@/entities";
import Container from "@/dataAccess/container";

export class PlayService {
  async getPlaysByPlaybookId(playbookId: string): Promise<Play[]> {
    try {
      const repo = Container.getPlayRepository();
      return await repo.getByPlaybookId(playbookId);
    } catch (error) {
      console.error(`Error getting plays for playbook ${playbookId}:`, error);
      throw new Error("Failed to fetch plays");
    }
  }

  async getPlayById(id: string): Promise<Play | null> {
    try {
      const repo = Container.getPlayRepository();
      return await repo.getById(id);
    } catch (error) {
      console.error(`Error getting play ${id}:`, error);
      throw new Error("Failed to fetch play");
    }
  }

  async createPlay(dto: CreatePlayDTO): Promise<Play> {
    if (!dto.name || dto.name.trim().length === 0) {
      throw new Error("Play name is required");
    }

    try {
      const repo = Container.getPlayRepository();
      return await repo.create(dto);
    } catch (error) {
      console.error("Error creating play:", error);
      throw new Error("Failed to create play");
    }
  }

  async updatePlayName(id: string, name: string): Promise<Play> {
    if (!name || name.trim().length === 0) {
      throw new Error("Play name is required");
    }

    try {
      const repo = Container.getPlayRepository();
      const dto: UpdatePlayDTO = { name: name.trim() };
      return await repo.update(id, dto);
    } catch (error) {
      console.error(`Error updating play ${id}:`, error);
      throw new Error("Failed to update play");
    }
  }

  async updatePlayPlayers(id: string, players: PlayerState[]): Promise<Play> {
    try {
      const repo = Container.getPlayRepository();
      const dto: UpdatePlayDTO = { players };
      return await repo.update(id, dto);
    } catch (error) {
      console.error(`Error updating play players ${id}:`, error);
      throw new Error("Failed to update players");
    }
  }

  async updatePlayRoutes(id: string, routes: PlayerRoute[]): Promise<Play> {
    try {
      const repo = Container.getPlayRepository();
      const dto: UpdatePlayDTO = { routes };
      return await repo.update(id, dto);
    } catch (error) {
      console.error(`Error updating play routes ${id}:`, error);
      throw new Error("Failed to update routes");
    }
  }

  async updatePlayAnnotations(id: string, annotations: AnnotationStroke[]): Promise<Play> {
    try {
      const repo = Container.getPlayRepository();
      const dto: UpdatePlayDTO = { annotations };
      return await repo.update(id, dto);
    } catch (error) {
      console.error(`Error updating play annotations ${id}:`, error);
      throw new Error("Failed to update annotations");
    }
  }

  async updatePlayRouteStyle(id: string, routeStyle: RouteStyle): Promise<Play> {
    try {
      const repo = Container.getPlayRepository();
      const dto: UpdatePlayDTO = { routeStyle };
      return await repo.update(id, dto);
    } catch (error) {
      console.error(`Error updating play route style ${id}:`, error);
      throw new Error("Failed to update route style");
    }
  }

  async applyFormationToPlay(playId: string, formationId: string): Promise<Play> {
    try {
      const formationRepo = Container.getFormationRepository();
      const formation = await formationRepo.getById(formationId);

      if (!formation) {
        throw new Error("Formation not found");
      }

      const repo = Container.getPlayRepository();
      const dto: UpdatePlayDTO = {
        formationId,
        players: formation.players,
      };
      return await repo.update(playId, dto);
    } catch (error) {
      console.error(`Error applying formation to play ${playId}:`, error);
      throw new Error("Failed to apply formation");
    }
  }

  async deletePlay(id: string): Promise<void> {
    try {
      const repo = Container.getPlayRepository();
      await repo.delete(id);
    } catch (error) {
      console.error(`Error deleting play ${id}:`, error);
      throw new Error("Failed to delete play");
    }
  }
}

export const playService = new PlayService();
