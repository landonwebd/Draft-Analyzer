import byeWeekData from "@/data/nflByeWeeks2026.json";

export function getNflByeWeek(nflTeam: string): number | null {
  const nflTeamAlias: Record<string, string> = {
    JAC: "JAX",
    WSH: "WAS",
  };

  const formattedNflTeam = nflTeam.toUpperCase().trim();
  const normalizedNflTeam = nflTeamAlias[formattedNflTeam] ?? formattedNflTeam;
  const nflByeWeeks: Record<string, number> = byeWeekData.by_team;
  const byeWeek = nflByeWeeks[normalizedNflTeam] ?? null;

  return byeWeek;
}
