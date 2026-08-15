import type { DraftPick, Player } from "@/types/draft";

export function convertDraftPicksToPlayers(picks: DraftPick[]): Player[] {
  return picks.map((pick) => ({
    id: pick.overall,
    name: pick.playerName,
    position: pick.position,
    pick: pick.pick,
    fantasyTeam: pick.fantasyTeam,
  }));
}
