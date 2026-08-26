"use client";

import { useEffect, useState } from "react";
import type { DraftPool, ImportedDraft } from "@/types/draft";
import { DRAFT_POOL_STORAGE_KEY } from "@/utils/draftPoolStorage";
import { DRAFT_STORAGE_KEY } from "@/utils/draftStorage";
import { mergeGuestDataIntoAccount, type GuestDataMergeResult } from "@/lib/supabase/guestDataTransfer";

export function useGuestDataTransfer(accountStorageIsActive: boolean) {
  const [guestDrafts, setGuestDrafts] = useState<ImportedDraft[]>([]);
  const [guestDraftPools, setGuestDraftPools] = useState<DraftPool[]>([]);
  const [hasLoadedGuestData, setHasLoadedGuestData] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      try {
        if (!accountStorageIsActive) {
          setGuestDrafts([]);
          setGuestDraftPools([]);
          return;
        }

        const storedDrafts = window.localStorage.getItem(DRAFT_STORAGE_KEY);

        if (storedDrafts) {
          const parsedDrafts: unknown = JSON.parse(storedDrafts);

          if (Array.isArray(parsedDrafts)) {
            setGuestDrafts(parsedDrafts as ImportedDraft[]);
          }
        }

        const storedDraftPools = window.localStorage.getItem(DRAFT_POOL_STORAGE_KEY);

        if (storedDraftPools) {
          const parsedDraftPools: unknown = JSON.parse(storedDraftPools);

          if (Array.isArray(parsedDraftPools)) {
            setGuestDraftPools(parsedDraftPools as DraftPool[]);
          }
        }
      } catch (error) {
        console.error("Unable to load guest browser data:", error);
      } finally {
        setHasLoadedGuestData(true);
      }
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [accountStorageIsActive]);

  const hasGuestData = guestDrafts.length > 0 || guestDraftPools.length > 0;

  function deleteGuestBrowserData(): boolean {
    if (!accountStorageIsActive || !hasGuestData) {
      return false;
    }

    try {
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
      window.localStorage.removeItem(DRAFT_POOL_STORAGE_KEY);

      setGuestDrafts([]);
      setGuestDraftPools([]);

      return true;
    } catch (error) {
      console.error("Unable to delete guest browser data:", error);
      return false;
    }
  }

  async function moveGuestBrowserDataToAccount(accountDraftPools: DraftPool[], accountDrafts: ImportedDraft[]): Promise<GuestDataMergeResult | null> {
    if (!accountStorageIsActive || !hasGuestData) {
      return null;
    }
    try {
      const mergeResult = await mergeGuestDataIntoAccount(guestDraftPools, guestDrafts, accountDraftPools, accountDrafts);
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
      window.localStorage.removeItem(DRAFT_POOL_STORAGE_KEY);
      setGuestDrafts([]);
      setGuestDraftPools([]);
      return mergeResult;
    } catch (error) {
      console.error("Unable to move guest data into account:", error);
      return null;
    }
  }

  return {
    guestDrafts,
    guestDraftPools,
    hasGuestData,
    hasLoadedGuestData,
    deleteGuestBrowserData,
    moveGuestBrowserDataToAccount,
  };
}
