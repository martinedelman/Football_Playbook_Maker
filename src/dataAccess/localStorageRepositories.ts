import {
  Playbook,
  Play,
  Formation,
  CreatePlaybookDTO,
  CreatePlayDTO,
  CreateFormationDTO,
  UpdatePlayDTO,
  PlaySide,
} from "@/entities";
import { PlaybookRepository, PlayRepository, FormationRepository } from "./repositories";
import { generateUUID } from "@/utils/uuid";

// Claves de localStorage con versionado
const STORAGE_KEYS = {
  PLAYBOOKS: "ffpb:v1:playbooks",
  FORMATIONS: "ffpb:v1:formations",
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
