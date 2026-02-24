import {
  Playbook,
  Play,
  Formation,
  CreatePlaybookDTO,
  CreatePlayDTO,
  CreateFormationDTO,
  UpdatePlayDTO,
} from "@/entities";

// Interfaces de repositorios (contratos)
export interface PlaybookRepository {
  getAll(): Promise<Playbook[]>;
  getById(id: string): Promise<Playbook | null>;
  create(dto: CreatePlaybookDTO): Promise<Playbook>;
  update(id: string, data: Partial<Playbook>): Promise<Playbook>;
  delete(id: string): Promise<void>;
}

export interface PlayRepository {
  getByPlaybookId(playbookId: string): Promise<Play[]>;
  getById(id: string): Promise<Play | null>;
  create(dto: CreatePlayDTO): Promise<Play>;
  update(id: string, dto: UpdatePlayDTO): Promise<Play>;
  delete(id: string): Promise<void>;
}

export interface FormationRepository {
  getAll(): Promise<Formation[]>;
  getById(id: string): Promise<Formation | null>;
  create(dto: CreateFormationDTO): Promise<Formation>;
  delete(id: string): Promise<void>;
}
