import type { DraftPick, ImportedDraft, PlayerRanking, Position, MeaningfulPass, PlayerRankingOverrides, RankingConfidenceLabel } from "@/types/draft";
import { createPlayerKey } from "@/utils/createPlayerKey";

type PlayerAccumulator = {
  playerName: string;
  position: Position;
  nflTeam: string;
  totalOverallPick: number;
  draftIds: Set<string>;
  myTotalOverallPick: number;
  myDraftIds: Set<string>;
  earliestOverallPick: number;
  latestOverallPick: number;
  myEarliestOverallPick: number | null;
  myLatestOverallPick: number | null;
};

type PersonalPassStats = {
  passOpportunityCount: number;
  timesPassed: number;
  personalPassPenalty: number;
  meaningfulPassCount: number;
  meaningfulPasses: MeaningfulPass[];
};

type RankingConfidence = {
  score: number;
  label: RankingConfidenceLabel;
};

const MAX_APPEARANCE_PENALTY = 12;
const MEANINGFUL_PASS_WEIGHT = 0.75;

function calculateRankingConfidence(timesDrafted: number, totalDrafts: number): RankingConfidence {
  if (timesDrafted === 0 || totalDrafts === 0) {
    return {
      score: 0,
      label: "Low",
    };
  }
  const draftRate = timesDrafted / totalDrafts;
  const sampleSizeStrength = timesDrafted / (timesDrafted + 10);
  const score = Math.sqrt(draftRate * sampleSizeStrength) * 100;
  let label: RankingConfidenceLabel = "Low";
  if (score >= 60) {
    label = "High";
  } else if (score >= 30) {
    label = "Medium";
  }
  return {
    score,
    label,
  };
}

function calculatePersonalPassStats(playerName: string, position: Position, nflTeam: string, drafts: ImportedDraft[], picksByDraftIdAndPlayerKey: Map<string, Map<string, DraftPick>>, userPicksByDraftId: Map<string, DraftPick[]>, leagueSizesByDraftId: Map<string, number>, playersByName: Map<string, PlayerAccumulator>, myDraftCount: number): PersonalPassStats {
  let passOpportunityCount = 0;
  let timesPassed = 0;
  let totalPassSeverity = 0;
  let meaningfulPassCount = 0;
  let opportunityLeagueSizeTotal = 0;
  const meaningfulPasses: MeaningfulPass[] = [];
  const playerKey = createPlayerKey(playerName, position, nflTeam);

  for (const draft of drafts) {
    const playerPick = picksByDraftIdAndPlayerKey.get(draft.id)?.get(playerKey);
    if (!playerPick) {
      continue;
    }
    const leagueSize = leagueSizesByDraftId.get(draft.id) ?? 0;
    const nearbyUserPicks = (userPicksByDraftId.get(draft.id) ?? []).filter((pick) => pick.overall <= playerPick.overall && playerPick.overall - pick.overall <= leagueSize);
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
  const severityPenalty = (totalPassSeverity / (passOpportunityCount + 5)) * MEANINGFUL_PASS_WEIGHT;
  const repeatedPreferencePenalty = averageOpportunityLeagueSize * MEANINGFUL_PASS_WEIGHT * (meaningfulPassCount / (meaningfulPassCount + 5));
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

export function buildPlayerRankings(drafts: ImportedDraft[], overrides: PlayerRankingOverrides = {}): PlayerRanking[] {
  if (drafts.length === 0) {
    return [];
  }
  const leagueSizesByDraftId = new Map(drafts.map((draft) => [draft.id, new Set(draft.picks.map((pick) => pick.fantasyTeam)).size]));
  const picksByDraftIdAndPlayerKey = new Map(drafts.map((draft) => [draft.id, new Map(draft.picks.map((pick) => [createPlayerKey(pick.playerName, pick.position, pick.nflTeam), pick]))]));
  const userPicksByDraftId = new Map(drafts.map((draft) => [draft.id, draft.picks.filter((pick) => pick.fantasyTeam === draft.myFantasyTeam)]));
  const playersByName = new Map<string, PlayerAccumulator>();
  for (const draft of drafts) {
    for (const pick of draft.picks) {
      const playerKey = createPlayerKey(pick.playerName, pick.position, pick.nflTeam);
      const draftedByMe = pick.fantasyTeam === draft.myFantasyTeam;
      const existingPlayer = playersByName.get(playerKey);

      if (existingPlayer) {
        existingPlayer.totalOverallPick += pick.overall;
        existingPlayer.draftIds.add(draft.id);
        existingPlayer.earliestOverallPick = Math.min(existingPlayer.earliestOverallPick, pick.overall);
        existingPlayer.latestOverallPick = Math.max(existingPlayer.latestOverallPick, pick.overall);
        if (draftedByMe) {
          existingPlayer.myTotalOverallPick += pick.overall;
          existingPlayer.myDraftIds.add(draft.id);
          existingPlayer.myEarliestOverallPick = existingPlayer.myEarliestOverallPick === null ? pick.overall : Math.min(existingPlayer.myEarliestOverallPick, pick.overall);
          existingPlayer.myLatestOverallPick = existingPlayer.myLatestOverallPick === null ? pick.overall : Math.max(existingPlayer.myLatestOverallPick, pick.overall);
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
        earliestOverallPick: pick.overall,
        latestOverallPick: pick.overall,
        myEarliestOverallPick: draftedByMe ? pick.overall : null,
        myLatestOverallPick: draftedByMe ? pick.overall : null,
      });
    }
  }
  const rankings = Array.from(playersByName.values()).map((player) => {
    const playerKey = createPlayerKey(player.playerName, player.position, player.nflTeam);
    const playerOverride = overrides[playerKey];
    const manualAdpAdjustment = playerOverride?.manualAdpAdjustment ?? 0;
    const isExcluded = playerOverride?.isExcluded ?? false;
    const totalDrafts = drafts.length;
    const timesDrafted = player.draftIds.size;
    const draftRate = timesDrafted / totalDrafts;
    const rankingConfidence = calculateRankingConfidence(timesDrafted, totalDrafts);
    const appearanceDeficit = 1 - draftRate;
    const appearancePenalty = MAX_APPEARANCE_PENALTY * appearanceDeficit ** 2;
    const averageOverallPick = player.totalOverallPick / timesDrafted;
    const myDraftCount = player.myDraftIds.size;
    const myDraftRate = myDraftCount / totalDrafts;
    const myAverageOverallPick = myDraftCount > 0 ? player.myTotalOverallPick / myDraftCount : null;
    const personalWeight = myDraftCount > 0 ? myDraftCount / (myDraftCount + 0.5) : 0;
    const preferredAverageOverallPick = myAverageOverallPick === null ? averageOverallPick : personalWeight * myAverageOverallPick + (1 - personalWeight) * averageOverallPick;
    const { passOpportunityCount, timesPassed, meaningfulPassCount, meaningfulPasses, personalPassPenalty } = calculatePersonalPassStats(player.playerName, player.position, player.nflTeam, drafts, picksByDraftIdAndPlayerKey, userPicksByDraftId, leagueSizesByDraftId, playersByName, myDraftCount);
    let weightedPickTotal = preferredAverageOverallPick * timesDrafted;

    for (const draft of drafts) {
      const playerWasDrafted = player.draftIds.has(draft.id);

      if (!playerWasDrafted) {
        const undraftedPenalty = draft.picks.length + 1;
        weightedPickTotal += undraftedPenalty;
      }
    }

    const weightedScore = weightedPickTotal / totalDrafts + personalPassPenalty + appearancePenalty;
    const finalPersonalizedAdp = Math.max(1, weightedScore + manualAdpAdjustment);

    return {
      playerName: player.playerName,
      position: player.position,
      nflTeam: player.nflTeam,
      totalDrafts,
      timesDrafted,
      draftRate,
      averageOverallPick,
      earliestOverallPick: player.earliestOverallPick,
      latestOverallPick: player.latestOverallPick,
      weightedScore,
      myDraftCount: myDraftCount,
      myAverageOverallPick: myAverageOverallPick,
      myEarliestOverallPick: player.myEarliestOverallPick,
      myLatestOverallPick: player.myLatestOverallPick,
      myDraftRate,
      passOpportunityCount,
      timesPassed,
      meaningfulPassCount,
      meaningfulPasses,
      personalPassPenalty,
      manualAdpAdjustment,
      finalPersonalizedAdp,
      isExcluded,
      rankingConfidence: rankingConfidence.score,
      rankingConfidenceLabel: rankingConfidence.label,
      appearancePenalty,
    };
  });

  const sortedRankings = rankings.sort((firstPlayer, secondPlayer) => firstPlayer.finalPersonalizedAdp - secondPlayer.finalPersonalizedAdp);
  const positionCounts: Record<Position, number> = {
    QB: 0,
    RB: 0,
    WR: 0,
    TE: 0,
    K: 0,
    DST: 0,
  };

  let visibleRank = 0;

  return sortedRankings.map((player) => {
    if (player.isExcluded) {
      return {
        ...player,
        rank: 0,
        positionRank: 0,
      };
    }

    visibleRank += 1;
    positionCounts[player.position] += 1;

    return {
      ...player,
      rank: visibleRank,
      positionRank: positionCounts[player.position],
    };
  });
}
