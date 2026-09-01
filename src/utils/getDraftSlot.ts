import type { ImportedDraft } from "@/types/draft";

export function getDraftSlot(draft: ImportedDraft): number | null {
  const userPicks = draft.picks.filter((pick) => {
    const fantasyTeamPick = pick.fantasyTeam === draft.myFantasyTeam;
    return fantasyTeamPick;
  });

  if (userPicks.length === 0) {
    return null;
  }

  return Math.min(...userPicks.map((pick) => pick.overall));
}
