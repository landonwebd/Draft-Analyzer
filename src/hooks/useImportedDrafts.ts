"use client";

import { useEffect, useState } from "react";
import type { ImportedDraft } from "@/types/draft";
import { DRAFT_STORAGE_KEY } from "@/utils/draftStorage";
import { hasAuthenticatedUser } from "@/lib/supabase/auth";
import { retryJwtIssuedAtFuture } from "@/lib/supabase/retryJwtIssuedAtFuture";
import { createDatabaseImportedDraft, deleteDatabaseImportedDraft, loadDatabaseImportedDrafts, assignDatabaseImportedDraftToPool, deleteDatabaseImportedDrafts } from "@/lib/supabase/importedDrafts";

export function useImportedDrafts() {
  const [importedDrafts, setImportedDrafts] = useState<ImportedDraft[]>([]);
  const [hasLoadedImportedDrafts, setHasLoadedImportedDrafts] = useState(false);
  const [importedDraftStorage, setImportedDraftStorage] = useState<"guest" | "database" | null>(null);

  useEffect(() => {
    let wasCancelled = false;

    async function loadImportedDrafts() {
      try {
        const userIsAuthenticated = await hasAuthenticatedUser();

        if (wasCancelled) {
          return;
        }

        if (userIsAuthenticated) {
          setImportedDraftStorage("database");

          const databaseDrafts = await retryJwtIssuedAtFuture(loadDatabaseImportedDrafts);

          if (!wasCancelled) {
            setImportedDrafts(databaseDrafts);
          }

          return;
        }

        setImportedDraftStorage("guest");

        const storedValue = window.localStorage.getItem(DRAFT_STORAGE_KEY);

        if (storedValue) {
          const parsedValue: unknown = JSON.parse(storedValue);

          if (Array.isArray(parsedValue)) {
            setImportedDrafts(parsedValue as ImportedDraft[]);
          }
        }
      } catch (error) {
        console.error("Unable to load saved drafts:", error);
      } finally {
        if (!wasCancelled) {
          setHasLoadedImportedDrafts(true);
        }
      }
    }

    void loadImportedDrafts();

    return () => {
      wasCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedImportedDrafts || importedDraftStorage !== "guest") {
      return;
    }

    if (importedDrafts.length === 0) {
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(importedDrafts));
  }, [importedDrafts, hasLoadedImportedDrafts, importedDraftStorage]);

  async function createImportedDraft(draft: ImportedDraft): Promise<boolean> {
    if (importedDraftStorage === null || draft.picks.length === 0 || importedDrafts.some((existingDraft) => existingDraft.sourceFileName === draft.sourceFileName)) {
      return false;
    }

    if (importedDraftStorage === "database") {
      try {
        const databaseDraft = await createDatabaseImportedDraft(draft);

        setImportedDrafts((currentDrafts) => [...currentDrafts, databaseDraft]);

        return true;
      } catch (error) {
        console.error("Unable to create imported draft:", error);
        return false;
      }
    }

    setImportedDrafts((currentDrafts) => [...currentDrafts, draft]);
    return true;
  }

  async function deleteImportedDraft(draftId: string): Promise<boolean> {
    if (importedDraftStorage === null || !importedDrafts.some((draft) => draft.id === draftId)) {
      return false;
    }

    if (importedDraftStorage === "database") {
      try {
        await deleteDatabaseImportedDraft(draftId);
      } catch (error) {
        console.error("Unable to delete imported draft:", error);
        return false;
      }
    }

    setImportedDrafts((currentDrafts) => currentDrafts.filter((draft) => draft.id !== draftId));

    return true;
  }

  async function deleteAllImportedDrafts(): Promise<boolean> {
    if (importedDraftStorage === null || importedDrafts.length === 0) {
      return false;
    }
    if (importedDraftStorage === "database") {
      try {
        await deleteDatabaseImportedDrafts(importedDrafts.map((draft) => draft.id));
      } catch (error) {
        console.error("Unable to delete all imported drafts:", error);
        return false;
      }
    }
    setImportedDrafts([]);
    return true;
  }

  async function assignImportedDraftToPool(draftId: string, poolId: string | undefined): Promise<boolean> {
    if (importedDraftStorage === null || !importedDrafts.some((draft) => draft.id === draftId)) {
      return false;
    }
    if (importedDraftStorage === "database") {
      try {
        await assignDatabaseImportedDraftToPool(draftId, poolId);
      } catch (error) {
        console.error("Unable to assign imported draft to pool:", error);
        return false;
      }
    }
    setImportedDrafts((currentDrafts) =>
      currentDrafts.map((draft) =>
        draft.id === draftId
          ? {
              ...draft,
              poolId,
            }
          : draft,
      ),
    );
    return true;
  }

  function unassignImportedDraftsFromPool(draftPoolId: string): void {
    setImportedDrafts((currentDrafts) =>
      currentDrafts.map((draft) =>
        draft.poolId === draftPoolId
          ? {
              ...draft,
              poolId: undefined,
            }
          : draft,
      ),
    );
  }

  function addMergedImportedDrafts(createdDrafts: ImportedDraft[]): void {
    if (importedDraftStorage !== "database") {
      return;
    }
    setImportedDrafts((currentDrafts) => {
      const currentDraftIds = new Set(currentDrafts.map((draft) => draft.id));
      const newDrafts = createdDrafts.filter((draft) => !currentDraftIds.has(draft.id));
      return [...currentDrafts, ...newDrafts];
    });
  }

  return {
    importedDrafts,
    hasLoadedImportedDrafts,
    importedDraftStorage,
    createImportedDraft,
    deleteImportedDraft,
    assignImportedDraftToPool,
    deleteAllImportedDrafts,
    unassignImportedDraftsFromPool,
    addMergedImportedDrafts,
  };
}
