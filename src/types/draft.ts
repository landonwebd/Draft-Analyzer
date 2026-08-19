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

export type PlayerRanking = {
  playerName: string;
  position: Position;
  nflTeam: string;
  totalDrafts: number;
  timesDrafted: number;
  draftRate: number;
  averageOverallPick: number;
  weightedScore: number;
  rank: number;
  positionRank: number;
  myDraftCount: number;
  myAverageOverallPick: number | null;
  myDraftRate: number;
  passOpportunityCount: number;
  timesPassed: number;
  meaningfulPassCount: number;
  meaningfulPasses: MeaningfulPass[];
  personalPassPenalty: number;
};

export type DraftTrackerStatus = "available" | "mine" | "taken";
export type DraftTrackerState = Record<string, DraftTrackerStatus>;
export type DraftTrackerSession = {
  isActive: boolean;
  playerStatuses: DraftTrackerState;
};

export type RankingSortField = "rank" | "weightedScore" | "myDraftCount" | "myAverageOverallPick" | "averageOverallPick" | "draftRate";
export type SortDirection = "ascending" | "descending";

export type PendingDraft = {
  id: string;
  fileName: string;
  picks: DraftPick[];
  selectedTeam: string;
  importError: string;
};

export type MeaningfulPass = {
  draftId: string;
  draftName: string;
  leagueSize: number;
  selectedPick: DraftPick;
  passedPlayerPick: DraftPick;
  passSeverity: number;
};
