import type { DraftPick, Position } from "@/types/draft";
import type { FantasyProsPick, FantasyProsPlayer } from "@/types/fantasyPros";

function isPosition(value: string): value is Position {
  return ["QB", "RB", "WR", "TE", "K", "DST"].includes(value);
}

export function convertFantasyProsPick(pick: FantasyProsPick, playerLookup: Map<number, FantasyProsPlayer>): DraftPick {
  const player = playerLookup.get(pick.id);

  if (!player) {
    throw new Error(`FantasyPros player ${pick.id} was not found.`);
  }

  if (!isPosition(player.position_id)) {
    throw new Error(`Unsupported position: ${player.position_id}`);
  }

  return {
    overall: pick.pick,
    pick: `${pick.round}.${String(pick.posInRound).padStart(2, "0")}`,
    playerName: player.player_name,
    position: player.position_id,
    nflTeam: player.team_id ?? "FA",
    fantasyTeam: pick.owner,
  };
}
