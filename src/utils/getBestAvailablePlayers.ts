import type { DraftPick, PlayerRanking } from "@/types/draft";
import { createPlayerKey } from "@/utils/createPlayerKey";

export function getBestAvailablePlayers(rankings: PlayerRanking[], draftedPicks: DraftPick[]): PlayerRanking[] {
  const draftedPlayerKeys = new Set(draftedPicks.map((pick) => createPlayerKey(pick.playerName, pick.position, pick.nflTeam)));
  return rankings.filter((player) => {
    const playerKey = createPlayerKey(player.playerName, player.position, player.nflTeam);

    return !player.isExcluded && !draftedPlayerKeys.has(playerKey);
  });
}
