import Papa from "papaparse";
import type { PlayerRanking } from "@/types/draft";
import rtSportsPlayers from "@/data/rtSportsId.json";

type RtSportsPlayer = {
  id: string;
  player: string;
};

// Duplicate NFL team names represent DST and position-room entries.
// The legacy DST entry uses the smallest numeric ID.
const playersByName = new Map<string, RtSportsPlayer>();

rtSportsPlayers.forEach((player) => {
  const currentPlayer = playersByName.get(player.player);

  if (!currentPlayer || Number(player.id) < Number(currentPlayer.id)) {
    playersByName.set(player.player, player);
  }
});

export function getUnmatchedRtSportsPlayerNames(rankings: PlayerRanking[]): string[] {
  return rankings.filter((ranking) => !playersByName.has(ranking.playerName)).map((ranking) => ranking.playerName);
}

export function createRtSportsRankingsCsv(rankings: PlayerRanking[]): string {
  const matchedPlayerIds = new Set<string>();

  const rankedPlayers = rankings.flatMap((ranking) => {
    const rtSportsPlayer = playersByName.get(ranking.playerName);

    if (!rtSportsPlayer || matchedPlayerIds.has(rtSportsPlayer.id)) {
      return [];
    }

    matchedPlayerIds.add(rtSportsPlayer.id);
    return [rtSportsPlayer];
  });

  const rows = rankedPlayers.map((player) => ({
    ID: player.id,
    Name: player.player,
  }));

  return Papa.unparse(rows);
}
