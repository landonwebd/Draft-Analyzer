import type { DraftPick } from "@/types/draft";
import type { FantasyProsDraftResponse, FantasyProsPlayer } from "@/types/fantasyPros";
import { convertFantasyProsPick } from "@/utils/convertFantasyProsPick";

export function convertFantasyProsDraft(response: FantasyProsDraftResponse, playerLookup: Map<number, FantasyProsPlayer>): DraftPick[] {
  return response.picks.map((pick) => convertFantasyProsPick(pick, playerLookup));
}
