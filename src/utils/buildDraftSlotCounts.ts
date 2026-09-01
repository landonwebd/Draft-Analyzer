import type { ImportedDraft } from "@/types/draft";
import { getDraftSlot } from "@/utils/getDraftSlot";
import { getDraftLeagueSize } from "@/utils/getDraftLeagueSize";

export type DraftSlotCount = {
  slot: number;
  draftCount: number;
};

export function buildDraftSlotCounts(drafts: ImportedDraft[]): DraftSlotCount[] {
  const countsBySlot = new Map<number, number>();

  drafts.forEach((draft) => {
    const slot = getDraftSlot(draft);

    if (slot === null) {
      return;
    }

    countsBySlot.set(slot, (countsBySlot.get(slot) ?? 0) + 1);
  });

  const largestLeagueSize = drafts.reduce((largestSize, draft) => {
    return Math.max(largestSize, getDraftLeagueSize(draft));
  }, 0);

  return Array.from({ length: largestLeagueSize }, (_, index) => {
    const slot = index + 1;
    return {
      slot,
      draftCount: countsBySlot.get(slot) ?? 0,
    };
  });
}
