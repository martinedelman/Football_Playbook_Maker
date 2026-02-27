import {
  Playbook,
  Play,
  Formation,
  PlayerTemplate,
  CreatePlaybookDTO,
  CreatePlayDTO,
  CreateFormationDTO,
  CreatePlayerTemplateDTO,
  UpdatePlayDTO,
  UpdatePlayerTemplateDTO,
  PlaySide,
  RouteStyle,
} from "@/entities";
import { PlaybookRepository, PlayRepository, FormationRepository, PlayerTemplateRepository } from "./repositories";
import { generateUUID } from "@/utils/uuid";

// Claves de localStorage con versionado
const STORAGE_KEYS = {
  PLAYBOOKS: "ffpb:v1:playbooks",
  FORMATIONS: "ffpb:v1:formations",
  PLAYER_TEMPLATES: "ffpb:v1:playerTemplates",
} as const;

// Helpers de localStorage
function getFromStorage<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
}

function setToStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

// Implementación de PlaybookRepository con localStorage
export class LocalStoragePlaybookRepository implements PlaybookRepository {
  async getAll(): Promise<Playbook[]> {
    return getFromStorage<Playbook[]>(STORAGE_KEYS.PLAYBOOKS) || [];
  }

  async getById(id: string): Promise<Playbook | null> {
    const playbooks = await this.getAll();
    return playbooks.find((pb) => pb.id === id) || null;
  }

  async create(dto: CreatePlaybookDTO): Promise<Playbook> {
    const playbooks = await this.getAll();
    const now = new Date().toISOString();
    const newPlaybook: Playbook = {
      id: generateUUID(),
      name: dto.name,
      plays: [],
      createdAt: now,
      updatedAt: now,
    };
    playbooks.push(newPlaybook);
    setToStorage(STORAGE_KEYS.PLAYBOOKS, playbooks);
    return newPlaybook;
  }

  async update(id: string, data: Partial<Playbook>): Promise<Playbook> {
    const playbooks = await this.getAll();
    const index = playbooks.findIndex((pb) => pb.id === id);
    if (index === -1) throw new Error("Playbook not found");

    const updated = {
      ...playbooks[index],
      ...data,
      id: playbooks[index].id, // no cambiar ID
      updatedAt: new Date().toISOString(),
    };
    playbooks[index] = updated;
    setToStorage(STORAGE_KEYS.PLAYBOOKS, playbooks);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const playbooks = await this.getAll();
    const filtered = playbooks.filter((pb) => pb.id !== id);
    setToStorage(STORAGE_KEYS.PLAYBOOKS, filtered);
  }
}

// Implementación de PlayRepository con localStorage
export class LocalStoragePlayRepository implements PlayRepository {
  private playbookRepo: PlaybookRepository;

  constructor(playbookRepo: PlaybookRepository) {
    this.playbookRepo = playbookRepo;
  }

  async getByPlaybookId(playbookId: string): Promise<Play[]> {
    const playbook = await this.playbookRepo.getById(playbookId);
    return playbook?.plays || [];
  }

  async getById(id: string): Promise<Play | null> {
    const playbooks = await this.playbookRepo.getAll();
    for (const pb of playbooks) {
      const play = pb.plays.find((p) => p.id === id);
      if (play) return play;
    }
    return null;
  }

  async create(dto: CreatePlayDTO): Promise<Play> {
    const playbook = await this.playbookRepo.getById(dto.playbookId);
    if (!playbook) throw new Error("Playbook not found");

    const now = new Date().toISOString();

    // Inicializar 5 jugadores en posiciones por defecto en zona de formación (parte inferior)
    // FIELD_WIDTH = 500, FIELD_HEIGHT = 300, zona de formación = y: 200-300
    const playerLabels = ["X", "Y", "QB", "F", "Z"];
    const defaultPlayers = Array.from({ length: 5 }, (_, i) => ({
      playerId: generateUUID(),
      label: playerLabels[i],
      x: 70 + i * 90, // Distribuidos horizontalmente (70 a 430)
      y: 240, // En la zona de formación (parte inferior)
    }));

    const newPlay: Play = {
      id: generateUUID(),
      name: dto.name,
      side: dto.side,
      formationId: dto.formationId,
      players: defaultPlayers,
      routes: [],
      annotations: [],
      routeStyle: RouteStyle.STRAIGHT,
      createdAt: now,
      updatedAt: now,
    };

    playbook.plays.push(newPlay);
    await this.playbookRepo.update(playbook.id, { plays: playbook.plays });
    return newPlay;
  }

  async update(id: string, dto: UpdatePlayDTO): Promise<Play> {
    const playbooks = await this.playbookRepo.getAll();

    for (const playbook of playbooks) {
      const playIndex = playbook.plays.findIndex((p) => p.id === id);
      if (playIndex !== -1) {
        const updated = {
          ...playbook.plays[playIndex],
          ...dto,
          id: playbook.plays[playIndex].id,
          updatedAt: new Date().toISOString(),
        };
        playbook.plays[playIndex] = updated;
        await this.playbookRepo.update(playbook.id, { plays: playbook.plays });
        return updated;
      }
    }

    throw new Error("Play not found");
  }

  async delete(id: string): Promise<void> {
    const playbooks = await this.playbookRepo.getAll();

    for (const playbook of playbooks) {
      const filtered = playbook.plays.filter((p) => p.id !== id);
      if (filtered.length !== playbook.plays.length) {
        await this.playbookRepo.update(playbook.id, { plays: filtered });
        return;
      }
    }
  }
}

// Implementación de FormationRepository con localStorage
export class LocalStorageFormationRepository implements FormationRepository {
  async getAll(): Promise<Formation[]> {
    return getFromStorage<Formation[]>(STORAGE_KEYS.FORMATIONS) || [];
  }

  async getById(id: string): Promise<Formation | null> {
    const formations = await this.getAll();
    return formations.find((f) => f.id === id) || null;
  }

  async create(dto: CreateFormationDTO): Promise<Formation> {
    const formations = await this.getAll();
    const now = new Date().toISOString();
    const newFormation: Formation = {
      id: generateUUID(),
      name: dto.name,
      side: dto.side,
      players: dto.players,
      createdAt: now,
      updatedAt: now,
    };
    formations.push(newFormation);
    setToStorage(STORAGE_KEYS.FORMATIONS, formations);
    return newFormation;
  }

  async delete(id: string): Promise<void> {
    const formations = await this.getAll();
    const filtered = formations.filter((f) => f.id !== id);
    setToStorage(STORAGE_KEYS.FORMATIONS, filtered);
  }
}

// Implementación de PlayerTemplateRepository con localStorage
export class LocalStoragePlayerTemplateRepository implements PlayerTemplateRepository {
  async getAll(): Promise<PlayerTemplate[]> {
    return getFromStorage<PlayerTemplate[]>(STORAGE_KEYS.PLAYER_TEMPLATES) || [];
  }

  async getById(id: string): Promise<PlayerTemplate | null> {
    const templates = await this.getAll();
    return templates.find((t) => t.id === id) || null;
  }

  async create(dto: CreatePlayerTemplateDTO): Promise<PlayerTemplate> {
    const templates = await this.getAll();
    const now = new Date().toISOString();

    // Use first 2 letters of name (uppercase) as default label if not provided
    const defaultLabel = dto.name.trim().substring(0, 2).toUpperCase() || "P";

    const newTemplate: PlayerTemplate = {
      id: generateUUID(),
      name: dto.name,
      playerLabel: dto.playerLabel || defaultLabel,
      playerColor: dto.playerColor,
      initialX: dto.initialX !== undefined ? dto.initialX : 250, // Centro del campo por defecto
      initialY: dto.initialY !== undefined ? dto.initialY : 150,
      routes: [],
      createdAt: now,
      updatedAt: now,
    };
    templates.push(newTemplate);
    setToStorage(STORAGE_KEYS.PLAYER_TEMPLATES, templates);
    return newTemplate;
  }

  async update(id: string, dto: UpdatePlayerTemplateDTO): Promise<PlayerTemplate> {
    const templates = await this.getAll();
    const index = templates.findIndex((t) => t.id === id);
    if (index === -1) throw new Error("Player template not found");

    const updated = {
      ...templates[index],
      ...dto,
      id: templates[index].id,
      updatedAt: new Date().toISOString(),
    };
    templates[index] = updated;
    setToStorage(STORAGE_KEYS.PLAYER_TEMPLATES, templates);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const templates = await this.getAll();
    const filtered = templates.filter((t) => t.id !== id);
    setToStorage(STORAGE_KEYS.PLAYER_TEMPLATES, filtered);
  }
}
