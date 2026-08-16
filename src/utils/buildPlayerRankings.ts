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

type PersonalPassStats = {
  passOpportunityCount: number;
  timesPassed: number;
  personalPassPenalty: number;
  meaningfulPassCount: number;
};

function normalizePlayerName(playerName: string): string {
  return playerName.trim().toLowerCase();
}

function calculatePersonalPassStats(playerName: string, drafts: ImportedDraft[], playersByName: Map<string, PlayerAccumulator>, myDraftCount: number): PersonalPassStats {
  let passOpportunityCount = 0;
  let timesPassed = 0;
  let totalPassSeverity = 0;
  let meaningfulPassCount = 0;
  let opportunityLeagueSizeTotal = 0;
  const playerKey = normalizePlayerName(playerName);

  for (const draft of drafts) {
    const playerPick = draft.picks.find((pick) => normalizePlayerName(pick.playerName) === playerKey);
    if (!playerPick) {
      continue;
    }
    const leagueSize = new Set(draft.picks.map((pick) => pick.fantasyTeam)).size;
    const nearbyUserPicks = draft.picks.filter((pick) => pick.fantasyTeam === draft.myFantasyTeam && pick.overall <= playerPick.overall && playerPick.overall - pick.overall <= leagueSize);
    const userSelectedPick = nearbyUserPicks.at(-1);

    if (!userSelectedPick) {
      continue;
    }
    passOpportunityCount += 1;
    opportunityLeagueSizeTotal += leagueSize;
    const playerWasDraftedByMe = playerPick.fantasyTeam === draft.myFantasyTeam;
    if (!playerWasDraftedByMe) {
      timesPassed += 1;

      const selectedPlayerData = playersByName.get(normalizePlayerName(userSelectedPick.playerName));
      const passedPlayerData = playersByName.get(playerKey);

      if (selectedPlayerData && passedPlayerData) {
        const selectedPlayerAverage = selectedPlayerData.totalOverallPick / selectedPlayerData.draftIds.size;
        const passedPlayerAverage = passedPlayerData.totalOverallPick / passedPlayerData.draftIds.size;
        const passSeverity = Math.min(leagueSize, Math.max(0, selectedPlayerAverage - passedPlayerAverage));
        if (passSeverity > 0) {
          meaningfulPassCount += 1;
        }
        totalPassSeverity += passSeverity;
      }
    }
  }
  const averageOpportunityLeagueSize = passOpportunityCount > 0 ? opportunityLeagueSizeTotal / passOpportunityCount : 0;
  const severityPenalty = (totalPassSeverity / (passOpportunityCount + 5)) * 1.5;
  const repeatedPreferencePenalty = averageOpportunityLeagueSize * 1.5 * (meaningfulPassCount / (meaningfulPassCount + 5));
  const draftHistoryProtection = 1 / (myDraftCount + 1);
  const personalPassPenalty = (severityPenalty + repeatedPreferencePenalty) * draftHistoryProtection;

  return {
    passOpportunityCount,
    timesPassed,
    meaningfulPassCount,
    personalPassPenalty,
  };
}

export function buildPlayerRankings(drafts: ImportedDraft[]): PlayerRanking[] {
  if (drafts.length === 0) {
    return [];
  }
  const playersByName = new Map<string, PlayerAccumulator>();
  for (const draft of drafts) {
    for (const pick of draft.picks) {
      const playerKey = normalizePlayerName(pick.playerName);
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
    const myDraftRate = myDraftCount / totalDrafts;
    const myAverageOverallPick = myDraftCount > 0 ? player.myTotalOverallPick / myDraftCount : null;
    const personalWeight = myDraftCount > 0 ? myDraftCount / (myDraftCount + 0.5) : 0;
    const preferredAverageOverallPick = myAverageOverallPick === null ? averageOverallPick : personalWeight * myAverageOverallPick + (1 - personalWeight) * averageOverallPick;
    const { passOpportunityCount, timesPassed, meaningfulPassCount, personalPassPenalty } = calculatePersonalPassStats(player.playerName, drafts, playersByName, myDraftCount);

    let weightedPickTotal = preferredAverageOverallPick * timesDrafted;

    for (const draft of drafts) {
      const playerWasDrafted = player.draftIds.has(draft.id);

      if (!playerWasDrafted) {
        const undraftedPenalty = draft.picks.length + 1;
        weightedPickTotal += undraftedPenalty;
      }
    }

    const weightedScore = weightedPickTotal / totalDrafts + personalPassPenalty;

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
      myDraftRate,
      passOpportunityCount,
      timesPassed,
      meaningfulPassCount,
      personalPassPenalty,
    };
  });

  const sortedRankings = rankings.sort((firstPlayer, secondPlayer) => firstPlayer.weightedScore - secondPlayer.weightedScore);

  return sortedRankings.map((player, index) => ({
    ...player,
    rank: index + 1,
  }));
}
