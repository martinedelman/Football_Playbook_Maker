// Tipos de coordenadas normalizadas (0-1000 para precision)
export interface Point {
  x: number;
  y: number;
}

// Enums
export enum PlaySide {
  OFFENSE = "offense",
  DEFENSE = "defense",
}

export enum RouteType {
  SOLID = "solid",
  DASHED = "dashed",
}

// Entidades principales
export interface PlayerState {
  playerId: string;
  label: string; // número o nombre del jugador
  x: number;
  y: number;
}

export interface PlayerRoute {
  playerId: string;
  points: Point[];
  type?: RouteType;
}

export interface AnnotationStroke {
  id: string;
  color: string;
  width: number;
  points: Point[];
}

export interface Formation {
  id: string;
  name: string;
  side: PlaySide;
  players: PlayerState[];
  createdAt: string;
  updatedAt: string;
}

export interface Play {
  id: string;
  name: string;
  side: PlaySide;
  formationId?: string;
  players: PlayerState[];
  routes: PlayerRoute[];
  annotations: AnnotationStroke[];
  createdAt: string;
  updatedAt: string;
}

export interface Playbook {
  id: string;
  name: string;
  plays: Play[];
  createdAt: string;
  updatedAt: string;
}

// DTOs para creación
export interface CreatePlaybookDTO {
  name: string;
}

export interface CreatePlayDTO {
  name: string;
  side: PlaySide;
  playbookId: string;
  formationId?: string;
}

export interface CreateFormationDTO {
  name: string;
  side: PlaySide;
  players: PlayerState[];
}

export interface UpdatePlayDTO {
  name?: string;
  players?: PlayerState[];
  routes?: PlayerRoute[];
  annotations?: AnnotationStroke[];
  formationId?: string;
}
