import type { FantasyProsPlayer } from "@/types/fantasyPros";

export function buildFantasyProsPlayerLookup(players: FantasyProsPlayer[]): Map<number, FantasyProsPlayer> {
  return new Map(players.map((player) => [player.player_id, player]));
}
