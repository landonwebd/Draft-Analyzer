import type { ImportedDraft } from "@/types/draft";

export function getDraftLeagueSize(draft: ImportedDraft): number {
  const fantasyTeams = draft.picks.map((pick) => pick.fantasyTeam);
  const uniqueFantasyTeams = new Set(fantasyTeams);

  return uniqueFantasyTeams.size;
}
