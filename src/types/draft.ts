export type Position = "QB" | "RB" | "WR" | "TE" | "K" | "DST";

export type PositionFilter = Position | "ALL";

export type Player = {
  id: number;
  name: string;
  position: Position;
  pick: string;
  fantasyTeam: string;
};

export type DraftPick = {
  overall: number;
  pick: string;
  playerName: string;
  position: Position;
  nflTeam: string;
  fantasyTeam: string;
};

export type ImportedDraft = {
  id: string;
  name: string;
  sourceFileName: string;
  importedAt: string;
  myFantasyTeam: string;
  picks: DraftPick[];
};
