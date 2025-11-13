export type Coordinate = {
  x: number;
  y: number;
};

export type Player = {
  id: string;
  label: string;
  role: string;
  position: Coordinate;
  routeName?: string;
  path?: Coordinate[];
};

export type Formation = {
  id: string;
  label: string;
  teamSize: number;
  description: string;
  players: Array<Omit<Player, "routeName" | "path" | "position"> & { position: Coordinate }>;
};

export type CoverageBlueprint = Record<string, Coordinate[]>;

export type PlayMode = "offense" | "defense";

export type OffensivePlay = {
  name: string;
  format: "tackle" | "flag5";
  formationId: string;
  players: Player[];
};

export type DefensivePlay = {
  name: string;
  formationId: string;
  coverageId: string;
  players: Player[];
};

export type PlaybookItem =
  | { type: "offense"; play: OffensivePlay }
  | { type: "defense"; play: DefensivePlay };
