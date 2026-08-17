import type { FantasyProsPlayersResponse } from "@/types/fantasyPros";

export async function getFantasyProsPlayers(): Promise<FantasyProsPlayersResponse> {
  const response = await fetch("/api/fantasypros/players");

  if (!response.ok) {
    throw new Error("Unable to load FantasyPros players.");
  }

  const data: FantasyProsPlayersResponse = await response.json();

  return data;
}
