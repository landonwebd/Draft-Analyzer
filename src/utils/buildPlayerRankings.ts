import type { ImportedDraft, PlayerRanking, Position, MeaningfulPass } from "@/types/draft";
import { createPlayerKey } from "@/utils/createPlayerKey";

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
  meaningfulPasses: MeaningfulPass[];
};

function calculatePersonalPassStats(playerName: string, position: Position, nflTeam: string, drafts: ImportedDraft[], playersByName: Map<string, PlayerAccumulator>, myDraftCount: number): PersonalPassStats {
  let passOpportunityCount = 0;
  let timesPassed = 0;
  let totalPassSeverity = 0;
  let meaningfulPassCount = 0;
  let opportunityLeagueSizeTotal = 0;
  const meaningfulPasses: MeaningfulPass[] = [];
  const playerKey = createPlayerKey(playerName, position, nflTeam);

  for (const draft of drafts) {
    const playerPick = draft.picks.find((pick) => createPlayerKey(pick.playerName, pick.position, pick.nflTeam) === playerKey);
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

      const selectedPlayerData = playersByName.get(createPlayerKey(userSelectedPick.playerName, userSelectedPick.position, userSelectedPick.nflTeam));
      const passedPlayerData = playersByName.get(playerKey);

      if (selectedPlayerData && passedPlayerData) {
        const selectedPlayerAverage = selectedPlayerData.totalOverallPick / selectedPlayerData.draftIds.size;
        const passedPlayerAverage = passedPlayerData.totalOverallPick / passedPlayerData.draftIds.size;
        const passSeverity = Math.min(leagueSize, Math.max(0, selectedPlayerAverage - passedPlayerAverage));
        if (passSeverity > 0) {
          meaningfulPassCount += 1;
          meaningfulPasses.push({
            draftId: draft.id,
            draftName: draft.name,
            leagueSize,
            selectedPick: userSelectedPick,
            passedPlayerPick: playerPick,
            passSeverity,
          });
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
    meaningfulPasses,
  };
}

export function buildPlayerRankings(drafts: ImportedDraft[]): PlayerRanking[] {
  if (drafts.length === 0) {
    return [];
  }
  const playersByName = new Map<string, PlayerAccumulator>();
  for (const draft of drafts) {
    for (const pick of draft.picks) {
      const playerKey = createPlayerKey(pick.playerName, pick.position, pick.nflTeam);
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
    const { passOpportunityCount, timesPassed, meaningfulPassCount, meaningfulPasses, personalPassPenalty } = calculatePersonalPassStats(player.playerName, player.position, player.nflTeam, drafts, playersByName, myDraftCount);
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
      meaningfulPasses,
      personalPassPenalty,
    };
  });

  const sortedRankings = rankings.sort((firstPlayer, secondPlayer) => firstPlayer.weightedScore - secondPlayer.weightedScore);
  const positionCounts: Record<Position, number> = {
    QB: 0,
    RB: 0,
    WR: 0,
    TE: 0,
    K: 0,
    DST: 0,
  };

  return sortedRankings.map((player, index) => {
    positionCounts[player.position] += 1;
    return {
      ...player,
      rank: index + 1,
      positionRank: positionCounts[player.position],
    };
  });
}
