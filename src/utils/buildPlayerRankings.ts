import type { ImportedDraft, PlayerRanking, Position } from "@/types/draft";

type PlayerAccumulator = {
  playerName: string;
  position: Position;
  nflTeam: string;
  totalOverallPick: number;
  draftIds: Set<string>;
  myTotalOverallPick: number;
  myDraftIds: Set<string>;
};

export function buildPlayerRankings(drafts: ImportedDraft[]): PlayerRanking[] {
  if (drafts.length === 0) {
    return [];
  }
  const playersByName = new Map<string, PlayerAccumulator>();
  for (const draft of drafts) {
    for (const pick of draft.picks) {
      const playerKey = pick.playerName.trim().toLowerCase();
      const draftedByMe = pick.fantasyTeam === draft.myFantasyTeam;
      const existingPlayer = playersByName.get(playerKey);

      if (existingPlayer) {
        existingPlayer.totalOverallPick += pick.overall;
        existingPlayer.draftIds.add(draft.id);
        if (draftedByMe) {
          existingPlayer.myTotalOverallPick += pick.overall;
          existingPlayer.myDraftIds.add(draft.id);
        }
        continue;
      }
      playersByName.set(playerKey, {
        playerName: pick.playerName,
        position: pick.position,
        nflTeam: pick.nflTeam,
        totalOverallPick: pick.overall,
        draftIds: new Set([draft.id]),
        myTotalOverallPick: draftedByMe ? pick.overall : 0,
        myDraftIds: draftedByMe ? new Set([draft.id]) : new Set<string>(),
      });
    }
  }
  const rankings = Array.from(playersByName.values()).map((player) => {
    const totalDrafts = drafts.length;
    const timesDrafted = player.draftIds.size;
    const draftRate = timesDrafted / totalDrafts;
    const averageOverallPick = player.totalOverallPick / timesDrafted;
    const myDraftCount = player.myDraftIds.size;
    const myAverageOverallPick = myDraftCount > 0 ? player.myTotalOverallPick / myDraftCount : null;
    const personalWeight = myDraftCount > 0 ? myDraftCount / (myDraftCount + 0.5) : 0;
    const preferredAverageOverallPick = myAverageOverallPick === null ? averageOverallPick : personalWeight * myAverageOverallPick + (1 - personalWeight) * averageOverallPick;

    let weightedPickTotal = preferredAverageOverallPick * timesDrafted;

    for (const draft of drafts) {
      const playerWasDrafted = player.draftIds.has(draft.id);

      if (!playerWasDrafted) {
        const undraftedPenalty = draft.picks.length + 1;
        weightedPickTotal += undraftedPenalty;
      }
    }

    const weightedScore = weightedPickTotal / totalDrafts;

    return {
      playerName: player.playerName,
      position: player.position,
      nflTeam: player.nflTeam,
      totalDrafts,
      timesDrafted,
      draftRate,
      averageOverallPick,
      weightedScore,
      myDraftCount: myDraftCount,
      myAverageOverallPick: myAverageOverallPick,
    };
  });

  const sortedRankings = rankings.sort((firstPlayer, secondPlayer) => firstPlayer.weightedScore - secondPlayer.weightedScore);

  return sortedRankings.map((player, index) => ({
    ...player,
    rank: index + 1,
  }));
}
