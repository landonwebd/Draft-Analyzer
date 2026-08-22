import Papa from "papaparse";
import type { PlayerRanking } from "@/types/draft";

export function createRankingsCsv(rankings: PlayerRanking[]): string {
  const rows = rankings.map((player) => ({
    "Calculated Personalized ADP": player.weightedScore.toFixed(2),
    "Ranking Confidence": player.rankingConfidenceLabel,
    "Confidence Score": player.rankingConfidence.toFixed(2),
    "Manual ADP Adjustment": player.manualAdpAdjustment.toFixed(2),
    "Personalized ADP": player.finalPersonalizedAdp.toFixed(2),
    Player: player.playerName,
    Position: player.position,
    "NFL Team": player.nflTeam,
    "My Draft Count": player.myDraftCount,
    "My Draft Rate": (player.myDraftRate * 100).toFixed(2),
    "Meaningful Passes": player.meaningfulPassCount,
    "Pass Opportunities": player.passOpportunityCount,
    "Times Passed": player.timesPassed,
    "Personal Pass Penalty": player.personalPassPenalty.toFixed(2),
    "Appearance Penalty": player.appearancePenalty.toFixed(2),
    "My Average Pick": player.myAverageOverallPick === null ? "" : player.myAverageOverallPick.toFixed(2),
    "My Earliest Pick": player.myEarliestOverallPick === null ? "" : player.myEarliestOverallPick,
    "My Latest Pick": player.myLatestOverallPick === null ? "" : player.myLatestOverallPick,
    "Overall Average Pick": player.averageOverallPick.toFixed(2),
    "Overall Earliest Pick": player.earliestOverallPick,
    "Overall Latest Pick": player.latestOverallPick,
    "Drafted Percent": (player.draftRate * 100).toFixed(2),
    "Draft Appearances": player.timesDrafted,
    "Total Drafts": player.totalDrafts,
  }));

  return Papa.unparse(rows);
}
