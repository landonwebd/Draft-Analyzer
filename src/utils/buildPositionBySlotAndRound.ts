import type { ImportedDraft, Position } from "@/types/draft";
import { getDraftLeagueSize } from "@/utils/getDraftLeagueSize";
import { getDraftSlot } from "@/utils/getDraftSlot";
import { buildDraftSlotCounts } from "@/utils/buildDraftSlotCounts";

export type PositionRate = {
  position: Position;
  draftCount: number;
  draftRate: number;
};

export type RoundPositionBreakdown = {
  round: number;
  draftCount: number;
  positions: PositionRate[];
};

export type PositionBySlotAndRound = {
  slot: number;
  draftCount: number;
  rounds: RoundPositionBreakdown[];
};

const positions: Position[] = ["QB", "RB", "WR", "TE", "K", "DST"];

export function buildPositionBySlotAndRound(drafts: ImportedDraft[]): PositionBySlotAndRound[] {
  const positionCountsBySlotAndRound = new Map<number, Map<number, Map<Position, number>>>();

  drafts.forEach((draft) => {
    const slot = getDraftSlot(draft);
    const leagueSize = getDraftLeagueSize(draft);

    if (slot === null || leagueSize === 0) {
      return;
    }

    const personalPositionByRound = new Map<number, Position>();

    draft.picks.forEach((pick) => {
      if (pick.fantasyTeam !== draft.myFantasyTeam) {
        return;
      }

      const round = Math.ceil(pick.overall / leagueSize);

      if (!personalPositionByRound.has(round)) {
        personalPositionByRound.set(round, pick.position);
      }
    });

    const positionCountsByRound = positionCountsBySlotAndRound.get(slot) ?? new Map<number, Map<Position, number>>();

    personalPositionByRound.forEach((position, round) => {
      const positionCounts = positionCountsByRound.get(round) ?? new Map<Position, number>();

      positionCounts.set(position, (positionCounts.get(position) ?? 0) + 1);

      positionCountsByRound.set(round, positionCounts);
    });

    positionCountsBySlotAndRound.set(slot, positionCountsByRound);
  });

  return buildDraftSlotCounts(drafts).map(({ slot, draftCount }) => {
    const positionCountsByRound = positionCountsBySlotAndRound.get(slot) ?? new Map<number, Map<Position, number>>();

    const rounds = Array.from(positionCountsByRound.entries())
      .sort(([firstRound], [secondRound]) => firstRound - secondRound)
      .map(([round, positionCounts]) => {
        const roundDraftCount = Array.from(positionCounts.values()).reduce((total, count) => total + count, 0);

        return {
          round,
          draftCount: roundDraftCount,
          positions: positions
            .map((position) => {
              const positionDraftCount = positionCounts.get(position) ?? 0;

              return {
                position,
                draftCount: positionDraftCount,
                draftRate: roundDraftCount === 0 ? 0 : positionDraftCount / roundDraftCount,
              };
            })
            .filter((position) => position.draftCount > 0),
        };
      });

    return {
      slot,
      draftCount,
      rounds,
    };
  });
}
