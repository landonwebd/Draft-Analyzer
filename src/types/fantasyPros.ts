export type FantasyProsPick = {
  owner: string;
  ownerPos: number;
  round: number;
  pick: number;
  isUserTeam: boolean;
  id: number;
  posInRound: number;
  isKeeper: boolean;
};

export type FantasyProsDraftResponse = {
  mockDraftKey: string;
  userPos: number;
  picks: FantasyProsPick[];
};

export type FantasyProsPlayer = {
  player_id: number;
  player_name: string;
  position_id: string;
  team_id: string | null;
};

export type FantasyProsPlayersResponse = {
  players: FantasyProsPlayer[];
};
