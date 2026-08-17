import type { FantasyProsDraftResponse } from "@/types/fantasyPros";

export function getFantasyProsPlayerIds(response: FantasyProsDraftResponse): number[] {
  return response.picks.map((pick) => pick.id);
}
