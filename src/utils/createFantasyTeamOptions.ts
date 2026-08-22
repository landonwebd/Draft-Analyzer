import type { SelectOption } from "@/components/FilterSelect";
import type { DraftPick } from "@/types/draft";

export function createFantasyTeamOptions(picks: DraftPick[]): SelectOption[] {
  const fantasyTeams = [...new Set(picks.map((pick) => pick.fantasyTeam).filter((team): team is string => Boolean(team)))].sort((firstTeam, secondTeam) =>
    firstTeam.localeCompare(secondTeam, undefined, {
      sensitivity: "base",
    }),
  );

  return [
    {
      value: "",
      label: "Select your fantasy team",
    },
    ...fantasyTeams.map((fantasyTeam) => ({
      value: fantasyTeam,
      label: fantasyTeam,
    })),
  ];
}
