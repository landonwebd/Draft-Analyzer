import type { DraftPool, ImportedDraft } from "@/types/draft";
import { createDraftPoolSlug } from "@/utils/createDraftPoolSlug";
import { createDatabaseDraftPool, deleteDatabaseDraftPool } from "@/lib/supabase/draftPools";
import { createDatabaseImportedDraft, deleteDatabaseImportedDrafts } from "@/lib/supabase/importedDrafts";

type GuestDraftPoolMerge = {
  createdDraftPools: DraftPool[];
  poolIdMap: Map<string, string>;
};

export async function mergeGuestDraftPools(guestDraftPools: DraftPool[], accountDraftPools: DraftPool[]): Promise<GuestDraftPoolMerge> {
  const createdDraftPools: DraftPool[] = [];
  const poolIdMap = new Map<string, string>();

  const accountPoolsBySlug = new Map(accountDraftPools.map((draftPool) => [createDraftPoolSlug(draftPool.name), draftPool]));

  try {
    for (const guestDraftPool of guestDraftPools) {
      const guestPoolSlug = createDraftPoolSlug(guestDraftPool.name);
      const matchingAccountPool = accountPoolsBySlug.get(guestPoolSlug);
      if (matchingAccountPool) {
        poolIdMap.set(guestDraftPool.id, matchingAccountPool.id);
        continue;
      }
      const createdDraftPool = await createDatabaseDraftPool(guestDraftPool.name, guestPoolSlug);
      createdDraftPools.push(createdDraftPool);
      accountPoolsBySlug.set(guestPoolSlug, createdDraftPool);
      poolIdMap.set(guestDraftPool.id, createdDraftPool.id);
    }
  } catch (error) {
    for (const createdDraftPool of [...createdDraftPools].reverse()) {
      try {
        await deleteDatabaseDraftPool(createdDraftPool.id);
      } catch (cleanupError) {
        console.error("Unable to clean up a partially transferred draft pool:", cleanupError);
      }
    }
    throw error;
  }

  return {
    createdDraftPools,
    poolIdMap,
  };
}

type GuestDraftMerge = {
  createdDrafts: ImportedDraft[];
  skippedDraftCount: number;
};

export async function mergeGuestDrafts(guestDrafts: ImportedDraft[], accountDrafts: ImportedDraft[], poolIdMap: Map<string, string>): Promise<GuestDraftMerge> {
  const createdDrafts: ImportedDraft[] = [];
  let skippedDraftCount = 0;

  const accountSourceFileNames = new Set(accountDrafts.map((draft) => draft.sourceFileName));

  try {
    for (const guestDraft of guestDrafts) {
      if (accountSourceFileNames.has(guestDraft.sourceFileName)) {
        skippedDraftCount += 1;
        continue;
      }
      const accountDraft: ImportedDraft = {
        ...guestDraft,
        id: crypto.randomUUID(),
        poolId: guestDraft.poolId ? poolIdMap.get(guestDraft.poolId) : undefined,
      };
      const createdDraft = await createDatabaseImportedDraft(accountDraft);
      createdDrafts.push(createdDraft);
      accountSourceFileNames.add(createdDraft.sourceFileName);
    }
  } catch (error) {
    if (createdDrafts.length > 0) {
      try {
        await deleteDatabaseImportedDrafts(createdDrafts.map((draft) => draft.id));
      } catch (cleanupError) {
        console.error("Unable to clean up partially transferred drafts:", cleanupError);
      }
    }
    throw error;
  }

  return {
    createdDrafts,
    skippedDraftCount,
  };
}

export type GuestDataMergeResult = {
  createdDraftPools: DraftPool[];
  createdDrafts: ImportedDraft[];
  skippedDraftCount: number;
};

export async function mergeGuestDataIntoAccount(guestDraftPools: DraftPool[], guestDrafts: ImportedDraft[], accountDraftPools: DraftPool[], accountDrafts: ImportedDraft[]): Promise<GuestDataMergeResult> {
  const poolMerge = await mergeGuestDraftPools(guestDraftPools, accountDraftPools);

  try {
    const draftMerge = await mergeGuestDrafts(guestDrafts, accountDrafts, poolMerge.poolIdMap);

    return {
      createdDraftPools: poolMerge.createdDraftPools,
      createdDrafts: draftMerge.createdDrafts,
      skippedDraftCount: draftMerge.skippedDraftCount,
    };
  } catch (error) {
    for (const createdDraftPool of [...poolMerge.createdDraftPools].reverse()) {
      try {
        await deleteDatabaseDraftPool(createdDraftPool.id);
      } catch (cleanupError) {
        console.error("Unable to clean up a partially transferred draft pool:", cleanupError);
      }
    }

    throw error;
  }
}
