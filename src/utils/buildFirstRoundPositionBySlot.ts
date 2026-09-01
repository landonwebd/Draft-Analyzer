import type { ImportedDraft, Position } from "@/types/draft";
import { buildDraftSlotCounts } from "@/utils/buildDraftSlotCounts";
import { getDraftSlot } from "@/utils/getDraftSlot";

export type FirstRoundPositionRate = {
  position: Position;
  draftCount: number;
  draftRate: number;
};

export type FirstRoundPositionBySlot = {
  slot: number;
  draftCount: number;
  positions: FirstRoundPositionRate[];
};

const positions: Position[] = ["QB", "RB", "WR", "TE", "K", "DST"];

export function buildFirstRoundPositionBySlot(drafts: ImportedDraft[]): FirstRoundPositionBySlot[] {
  const positionCountsBySlot = new Map<number, Map<Position, number>>();

  drafts.forEach((draft) => {
    const slot = getDraftSlot(draft);

    if (slot === null) {
      return;
    }

    const firstPick = draft.picks.find((pick) => pick.fantasyTeam === draft.myFantasyTeam && pick.overall === slot);

    if (!firstPick) {
      return;
    }

    const positionCounts = positionCountsBySlot.get(slot) ?? new Map<Position, number>();

    positionCounts.set(firstPick.position, (positionCounts.get(firstPick.position) ?? 0) + 1);

    positionCountsBySlot.set(slot, positionCounts);
  });

  return buildDraftSlotCounts(drafts).map(({ slot, draftCount }) => {
    const positionCounts = positionCountsBySlot.get(slot);

    return {
      slot,
      draftCount,
      positions: positions
        .map((position) => {
          const positionDraftCount = positionCounts?.get(position) ?? 0;

          return {
            position,
            draftCount: positionDraftCount,
            draftRate: draftCount === 0 ? 0 : positionDraftCount / draftCount,
          };
        })
        .filter((position) => position.draftCount > 0),
    };
  });
}
