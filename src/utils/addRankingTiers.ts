import type { PlayerRanking } from "@/types/draft";

export type TieredPlayerRanking = PlayerRanking & {
  tier: number;
};

const INITIAL_TIER_GAP_THRESHOLD = 2;
const TIER_GAP_THRESHOLD_INCREASE = 0.5;
const SOFT_MAX_PLAYERS_PER_TIER = 18;
const TIER_BREAK_GRACE_PERIOD = 3;
const HARD_MAX_PLAYERS_PER_TIER = SOFT_MAX_PLAYERS_PER_TIER + TIER_BREAK_GRACE_PERIOD;

export function addRankingTiers(players: PlayerRanking[]): TieredPlayerRanking[] {
  const playersByPersonalizedAdp = [...players].sort((firstPlayer, secondPlayer) => firstPlayer.finalPersonalizedAdp - secondPlayer.finalPersonalizedAdp);

  let currentTier = 1;
  let playersInCurrentTier = 0;

  return playersByPersonalizedAdp.map((player, index) => {
    if (index > 0) {
      const previousPlayer = playersByPersonalizedAdp[index - 1];
      const scoreGap = player.finalPersonalizedAdp - previousPlayer.finalPersonalizedAdp;
      const currentTierGapThreshold = INITIAL_TIER_GAP_THRESHOLD + (currentTier - 1) * TIER_GAP_THRESHOLD_INCREASE;
      const hasNaturalTierBreak = scoreGap >= currentTierGapThreshold;
      const hasReachedHardMaximum = playersInCurrentTier >= HARD_MAX_PLAYERS_PER_TIER;

      if (hasNaturalTierBreak || hasReachedHardMaximum) {
        currentTier += 1;
        playersInCurrentTier = 0;
      }
    }

    playersInCurrentTier += 1;

    return {
      ...player,
      tier: currentTier,
    };
  });
}
